using FitSync_API.Data;
using FitSync_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DietController : ControllerBase
    {
        private readonly FitSyncDbContext _context;

        public DietController(FitSyncDbContext context)
        {
            _context = context;
        }


        // ============================
        // GET ALL DIET PLANS
        // Optional filters: ?goal=Weight Loss&preference=Veg
        // ============================
        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans([FromQuery] string? goal, [FromQuery] string? preference)
        {
            var query = _context.DietPlans
                .Where(d => d.IsActive)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(goal))
            {
                query = query.Where(d => d.Goal.ToLower() == goal.Trim().ToLower());
            }

            var plans = await query
                .OrderBy(d => d.Name)
                .Select(d => new
                {
                    d.DietPlanId,
                    d.Name,
                    d.Goal,
                    d.Description,
                    d.DailyCalories,
                    d.ProteinGrams,
                    d.CarbsGrams,
                    d.FatGrams,
                    d.ImageUrl
                })
                .ToListAsync();

            return Ok(plans);
        }


        // ============================
        // GET SINGLE PLAN WITH MEALS
        // Optional filter: ?preference=Veg or NonVeg
        // Defaults to Veg meals when no preference is given.
        // ============================
        [HttpGet("plans/{id}")]
        public async Task<IActionResult> GetPlan(int id, [FromQuery] string? preference)
        {
            var wantVeg = !string.Equals(preference, "NonVeg", StringComparison.OrdinalIgnoreCase);

            var plan = await _context.DietPlans
                .Where(d => d.DietPlanId == id && d.IsActive)
                .Include(d => d.Meals.Where(m => m.IsVegetarian == wantVeg).OrderBy(m => m.OrderIndex))
                .FirstOrDefaultAsync();

            if (plan == null)
            {
                return NotFound(new { message = "Diet plan not found." });
            }

            return Ok(new
            {
                plan.DietPlanId,
                plan.Name,
                plan.Goal,
                plan.Description,
                plan.DailyCalories,
                plan.ProteinGrams,
                plan.CarbsGrams,
                plan.FatGrams,
                plan.ImageUrl,
                Preference = wantVeg ? "Veg" : "NonVeg",
                Meals = plan.Meals.Select(m => new
                {
                    m.MealId,
                    m.MealType,
                    m.Name,
                    m.Description,
                    m.Calories,
                    m.IsVegetarian
                })
            });
        }


        // ============================
        // SELECT / SAVE A PLAN FOR A USER
        // ============================
        [HttpPost("select")]
        public async Task<IActionResult> SelectPlan(SelectDietPlanRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var plan = await _context.DietPlans
                .FirstOrDefaultAsync(d => d.DietPlanId == request.DietPlanId && d.IsActive);

            if (plan == null)
            {
                return NotFound(new { message = "Diet plan not found." });
            }

            // Retire any currently active plan for this user
            var currentPlans = await _context.UserDietPlans
                .Where(u => u.UserId == request.UserId && u.Status == "Active")
                .ToListAsync();

            foreach (var existing in currentPlans)
            {
                existing.Status = "Replaced";
            }

            var userPlan = new UserDietPlan
            {
                UserId = request.UserId,
                DietPlanId = request.DietPlanId,
                StartDate = DateTime.UtcNow,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.UserDietPlans.Add(userPlan);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{plan.Name} is now your active diet plan.",
                userDietPlanId = userPlan.UserDietPlanId
            });
        }


        // ============================
        // GET A USER'S CURRENT PLAN
        // ============================
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserPlan(int userId)
        {
            var userPlan = await _context.UserDietPlans
                .Where(u => u.UserId == userId && u.Status == "Active")
                .Include(u => u.DietPlan)
                .OrderByDescending(u => u.StartDate)
                .Select(u => new
                {
                    u.UserDietPlanId,
                    u.StartDate,
                    u.Status,
                    PlanId = u.DietPlan.DietPlanId,
                    PlanName = u.DietPlan.Name,
                    Goal = u.DietPlan.Goal,
                    DailyCalories = u.DietPlan.DailyCalories
                })
                .FirstOrDefaultAsync();

            if (userPlan == null)
            {
                return Ok(new { message = "No active diet plan.", plan = (object?)null });
            }

            return Ok(userPlan);
        }


        // ============================
        // GENERATE A PERSONALIZED PLAN
        // Computes BMR (Mifflin-St Jeor) + TDEE from age/height/
        // weight/gender, adjusts for the chosen goal, matches the
        // closest plan, and returns its meals filtered by
        // dietary preference. Also saves the profile + activates
        // the matched plan for the user.
        // ============================
        [HttpPost("profile")]
        public async Task<IActionResult> SaveProfile(DietProfileRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (request.Age <= 0 || request.HeightCm <= 0 || request.WeightKg <= 0)
            {
                return BadRequest(new { message = "Age, height, and weight must be greater than zero." });
            }

            if (!string.Equals(request.Gender, "Male", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(request.Gender, "Female", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Gender must be Male or Female." });
            }

            var isVeg = string.Equals(request.DietaryPreference, "Veg", StringComparison.OrdinalIgnoreCase);

            // Mifflin-St Jeor equation
            decimal bmr = string.Equals(request.Gender, "Male", StringComparison.OrdinalIgnoreCase)
                ? (10 * request.WeightKg) + (6.25m * request.HeightCm) - (5 * request.Age) + 5
                : (10 * request.WeightKg) + (6.25m * request.HeightCm) - (5 * request.Age) - 161;

            // Moderate activity assumption (exercising ~3-5 days/week)
            decimal tdee = bmr * 1.55m;

            int recommendedCalories = request.Goal.ToLower() switch
            {
                "weight loss" => (int)Math.Round((tdee - 500) / 50) * 50,
                "muscle gain" => (int)Math.Round((tdee + 400) / 50) * 50,
                _ => (int)Math.Round(tdee / 50) * 50
            };

            var plan = await _context.DietPlans
                .Where(d => d.IsActive && d.Goal.ToLower() == request.Goal.ToLower())
                .Include(d => d.Meals.Where(m => m.IsVegetarian == isVeg).OrderBy(m => m.OrderIndex))
                .FirstOrDefaultAsync();

            if (plan == null)
            {
                return NotFound(new { message = "No plan matches that goal yet." });
            }

            var existingProfile = await _context.DietProfiles
                .FirstOrDefaultAsync(p => p.UserId == request.UserId);

            if (existingProfile == null)
            {
                existingProfile = new DietProfile
                {
                    UserId = request.UserId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.DietProfiles.Add(existingProfile);
            }

            existingProfile.Age = request.Age;
            existingProfile.HeightCm = request.HeightCm;
            existingProfile.WeightKg = request.WeightKg;
            existingProfile.Gender = request.Gender;
            existingProfile.DietaryPreference = isVeg ? "Veg" : "NonVeg";
            existingProfile.Goal = request.Goal;
            existingProfile.Bmr = Math.Round(bmr, 0);
            existingProfile.Tdee = Math.Round(tdee, 0);
            existingProfile.RecommendedCalories = recommendedCalories;
            existingProfile.UpdatedAt = DateTime.UtcNow;

            // Activate the matched plan for this user
            var currentPlans = await _context.UserDietPlans
                .Where(u => u.UserId == request.UserId && u.Status == "Active")
                .ToListAsync();

            foreach (var existing in currentPlans)
            {
                existing.Status = "Replaced";
            }

            _context.UserDietPlans.Add(new UserDietPlan
            {
                UserId = request.UserId,
                DietPlanId = plan.DietPlanId,
                StartDate = DateTime.UtcNow,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Your personalized plan is ready.",
                bmr = existingProfile.Bmr,
                tdee = existingProfile.Tdee,
                recommendedCalories,
                plan = new
                {
                    plan.DietPlanId,
                    plan.Name,
                    plan.Goal,
                    plan.Description,
                    plan.DailyCalories,
                    plan.ProteinGrams,
                    plan.CarbsGrams,
                    plan.FatGrams,
                    Preference = isVeg ? "Veg" : "NonVeg",
                    Meals = plan.Meals.Select(m => new
                    {
                        m.MealId,
                        m.MealType,
                        m.Name,
                        m.Description,
                        m.Calories,
                        m.IsVegetarian
                    })
                }
            });
        }


        // ============================
        // GET A USER'S SAVED PROFILE
        // ============================
        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var profile = await _context.DietProfiles
                .Where(p => p.UserId == userId)
                .Select(p => new
                {
                    p.ProfileId,
                    p.Age,
                    p.HeightCm,
                    p.WeightKg,
                    p.Gender,
                    p.DietaryPreference,
                    p.Goal,
                    p.Bmr,
                    p.Tdee,
                    p.RecommendedCalories,
                    p.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (profile == null)
            {
                return Ok(new { message = "No profile saved yet.", profile = (object?)null });
            }

            return Ok(profile);
        }
    }


    // =====================================
    // SELECT DIET PLAN REQUEST MODEL
    // =====================================
    public class SelectDietPlanRequest
    {
        public int UserId { get; set; }

        public int DietPlanId { get; set; }
    }


    // =====================================
    // DIET PROFILE REQUEST MODEL
    // =====================================
    public class DietProfileRequest
    {
        public int UserId { get; set; }

        public int Age { get; set; }

        public decimal HeightCm { get; set; }

        public decimal WeightKg { get; set; }

        public string Gender { get; set; } = string.Empty; // Male, Female

        public string DietaryPreference { get; set; } = string.Empty; // Veg, NonVeg

        public string Goal { get; set; } = string.Empty; // Weight Loss, Muscle Gain, Maintenance
    }
}
