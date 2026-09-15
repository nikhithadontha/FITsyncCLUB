using FitSync_API.Data;
using FitSync_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController : ControllerBase
    {
        private readonly FitSyncDbContext _context;

        public SubscriptionController(FitSyncDbContext context)
        {
            _context = context;
        }

        // ============================
        // GET ALL ACTIVE PLANS
        // ============================
        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _context.SubscriptionPlans
                .Where(p => p.IsActive)
                .OrderBy(p => p.Price)
                .ToListAsync();

            return Ok(plans);
        }

        // ============================
        // SUBSCRIBE A USER TO A PLAN (STRICT ONLY ONE ACTIVE)
        // ============================
        [HttpPost("subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var plan = await _context.SubscriptionPlans
                .FirstOrDefaultAsync(p => p.PlanId == request.PlanId && p.IsActive);

            if (plan == null)
            {
                return NotFound(new { message = "Subscription plan not found." });
            }

            // STRICT VALIDATION: If user already has an active subscription, return 409 Conflict
            var activeSubscription = await _context.UserSubscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.Status == "Active" && s.EndDate > DateTime.UtcNow);

            if (activeSubscription != null)
            {
                var currentPlanName = activeSubscription.Plan?.PlanName ?? "Current Plan";
                return StatusCode(409, new
                {
                    message = $"You already have an active subscription ({currentPlanName}). You must cancel your current active plan before subscribing to a new one.",
                    activeSubscription = new
                    {
                        activeSubscription.UserSubscriptionId,
                        activeSubscription.PlanId,
                        PlanName = currentPlanName,
                        activeSubscription.EndDate
                    }
                });
            }

            var newSubscription = new UserSubscription
            {
                UserId = request.UserId,
                PlanId = request.PlanId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(plan.DurationDays),
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.UserSubscriptions.Add(newSubscription);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Subscribed to {plan.PlanName}.",
                subscriptionId = newSubscription.UserSubscriptionId,
                expiresOn = newSubscription.EndDate
            });
        }

        // ============================
        // CANCEL ACTIVE SUBSCRIPTION
        // ============================
        [HttpPost("cancel")]
        public async Task<IActionResult> CancelSubscription([FromBody] CancelSubscriptionRequest request)
        {
            var activeSubscriptions = await _context.UserSubscriptions
                .Where(s => s.UserId == request.UserId && s.Status == "Active")
                .ToListAsync();

            if (!activeSubscriptions.Any())
            {
                return BadRequest(new { message = "No active subscription found to cancel." });
            }

            foreach (var sub in activeSubscriptions)
            {
                sub.Status = "Cancelled";
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Your active subscription has been cancelled successfully." });
        }

        // ============================
        // 1-DAY FREE TRIAL (ONCE PER USER)
        // ============================
        [HttpPost("trial")]
        public async Task<IActionResult> ActivateTrial([FromBody] TrialRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (user.HasUsedTrial)
            {
                return BadRequest(new { message = "You have already used your 1-Day Free Trial." });
            }

            var activeSubscription = await _context.UserSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.Status == "Active" && s.EndDate > DateTime.UtcNow);

            if (activeSubscription != null)
            {
                return StatusCode(409, new { message = "You already have an active subscription." });
            }

            // Get or create a 1-Day Trial plan if needed, or point to lowest plan ID
            var firstPlan = await _context.SubscriptionPlans.FirstOrDefaultAsync() ?? new SubscriptionPlan { PlanId = 1 };

            var trialSubscription = new UserSubscription
            {
                UserId = request.UserId,
                PlanId = firstPlan.PlanId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1),
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            user.HasUsedTrial = true;
            _context.UserSubscriptions.Add(trialSubscription);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "1-Day Free Trial activated! Full gym access unlocked for 24 hours.",
                subscriptionId = trialSubscription.UserSubscriptionId,
                expiresOn = trialSubscription.EndDate,
                planName = "1-Day Free Trial"
            });
        }

        // ============================
        // GET A USER'S ACTIVE SUBSCRIPTION
        // ============================
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserSubscription(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            var subscription = await _context.UserSubscriptions
                .Where(s => s.UserId == userId && s.Status == "Active" && s.EndDate > DateTime.UtcNow)
                .Include(s => s.Plan)
                .OrderByDescending(s => s.StartDate)
                .Select(s => new
                {
                    s.UserSubscriptionId,
                    s.StartDate,
                    s.EndDate,
                    s.Status,
                    PlanName = s.Plan != null ? s.Plan.PlanName : "Active Plan",
                    Price = s.Plan != null ? s.Plan.Price : 0
                })
                .FirstOrDefaultAsync();

            return Ok(new
            {
                hasActiveSubscription = subscription != null,
                activeSubscription = subscription,
                hasUsedTrial = user?.HasUsedTrial ?? false
            });
        }
    }

    public class SubscribeRequest
    {
        public int UserId { get; set; }
        public int PlanId { get; set; }
    }

    public class CancelSubscriptionRequest
    {
        public int UserId { get; set; }
    }

    public class TrialRequest
    {
        public int UserId { get; set; }
    }
}
