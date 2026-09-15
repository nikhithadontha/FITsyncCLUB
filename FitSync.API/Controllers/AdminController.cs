using FitSync_API.Data;
using FitSync_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Controllers
{
    // ============================================================
    // ADMIN CONTROLLER
    // Backs the Admin Portal (wwwroot/admin.html + js/admin.js).
    // NOTE: This controller intentionally has no authentication
    // middleware wired up yet (matching the rest of this project,
    // which does not use tokens/cookies). The admin.html page
    // itself only *hides* the UI from non-admins on the client -
    // if you need real security before submitting, add an
    // [Authorize] policy / admin API key check here.
    // ============================================================
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly FitSyncDbContext _context;

        public AdminController(FitSyncDbContext context)
        {
            _context = context;
        }

        // ============================
        // GET DASHBOARD OVERVIEW METRICS
        // ============================
        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var totalUsers = await _context.Users.CountAsync(u => u.Role != "Admin");
            var activeSubscriptions = await _context.UserSubscriptions.CountAsync(s => s.Status == "Active" && s.EndDate >= DateTime.UtcNow);
            var totalTrainers = await _context.Trainers.CountAsync(t => t.IsActive);
            var totalClasses = await _context.ClassSchedules.CountAsync(c => c.IsActive);
            var totalBookings = await _context.Bookings.CountAsync();

            return Ok(new
            {
                totalUsers,
                activeSubscriptions,
                totalTrainers,
                totalClasses,
                totalBookings
            });
        }

        // ================================================================
        // TRAINERS
        // ================================================================
        [HttpGet("trainers")]
        public async Task<IActionResult> GetTrainers()
        {
            var trainers = await _context.Trainers
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.TrainerId,
                    t.FullName,
                    t.Email,
                    t.PhoneNumber,
                    t.Specialization,
                    t.ExperienceYears,
                    t.Bio,
                    t.IsActive
                })
                .ToListAsync();

            return Ok(trainers);
        }

        [HttpPost("trainers")]
        public async Task<IActionResult> CreateTrainer([FromBody] CreateTrainerRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Specialization))
            {
                return BadRequest(new { message = "Trainer name and specialization are required." });
            }

            // Auto-generate a placeholder email/phone since the admin form doesn't collect them.
            var slug = new string(request.FullName.Trim().ToLower().Where(char.IsLetterOrDigit).ToArray());
            if (string.IsNullOrWhiteSpace(slug)) slug = "trainer";
            var email = $"{slug}.{Guid.NewGuid().ToString("N").Substring(0, 6)}@fitsync.com";

            var trainer = new Trainer
            {
                FullName = request.FullName.Trim(),
                Email = email,
                Specialization = request.Specialization.Trim(),
                ExperienceYears = request.ExperienceYears ?? 1,
                Bio = request.Bio,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Trainers.Add(trainer);
            await _context.SaveChangesAsync();

            // A brand-new trainer needs bookable slots right away.
            TrainingSlotSeeder.TopUpSlotsForTrainer(_context, trainer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Trainer added.", trainer.TrainerId });
        }

        [HttpDelete("trainers/{id}")]
        public async Task<IActionResult> DeleteTrainer(int id)
        {
            var trainer = await _context.Trainers.FindAsync(id);
            if (trainer == null)
            {
                return NotFound(new { message = "Trainer not found." });
            }

            // Soft-delete: keeps booking history intact instead of breaking FK constraints.
            trainer.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Trainer removed." });
        }

        // ================================================================
        // CLASSES
        // ================================================================
        [HttpGet("classes")]
        public async Task<IActionResult> GetClasses()
        {
            var classes = await _context.ClassSchedules
                .Where(c => c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.ClassId,
                    c.Name,
                    c.Category,
                    c.TrainerName,
                    c.ScheduleTime,
                    c.IsOnline,
                    c.RoomNumber,
                    c.MeetLink
                })
                .ToListAsync();

            return Ok(classes);
        }

        [HttpPost("classes")]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.TrainerName))
            {
                return BadRequest(new { message = "Class name and trainer name are required." });
            }

            var newClass = new ClassSchedule
            {
                Name = request.Name.Trim(),
                Category = string.IsNullOrWhiteSpace(request.Category) ? "Strength" : request.Category.Trim(),
                TrainerName = request.TrainerName.Trim(),
                ScheduleTime = request.ScheduleTime?.Trim() ?? string.Empty,
                IsOnline = request.IsOnline,
                RoomNumber = request.IsOnline ? null : request.RoomNumber,
                MeetLink = request.IsOnline ? request.MeetLink : null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ClassSchedules.Add(newClass);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Class created.", newClass.ClassId });
        }

        [HttpDelete("classes/{id}")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            var cls = await _context.ClassSchedules.FindAsync(id);
            if (cls == null)
            {
                return NotFound(new { message = "Class not found." });
            }

            _context.ClassSchedules.Remove(cls);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Class deleted." });
        }

        // ================================================================
        // FACILITIES
        // ================================================================
        [HttpGet("facilities")]
        public async Task<IActionResult> GetFacilities()
        {
            var facilities = await _context.Facilities
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    f.FacilityId,
                    f.Name,
                    f.Type,
                    f.Location,
                    f.OpenHours,
                    f.Status
                })
                .ToListAsync();

            return Ok(facilities);
        }

        [HttpPost("facilities")]
        public async Task<IActionResult> CreateFacility([FromBody] CreateFacilityRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Type))
            {
                return BadRequest(new { message = "Facility name and type are required." });
            }

            var facility = new Facility
            {
                Name = request.Name.Trim(),
                Type = request.Type.Trim(),
                Location = request.Location?.Trim() ?? string.Empty,
                OpenHours = request.OpenHours?.Trim() ?? string.Empty,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            _context.Facilities.Add(facility);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Facility added.", facility.FacilityId });
        }

        [HttpDelete("facilities/{id}")]
        public async Task<IActionResult> DeleteFacility(int id)
        {
            var facility = await _context.Facilities.FindAsync(id);
            if (facility == null)
            {
                return NotFound(new { message = "Facility not found." });
            }

            _context.Facilities.Remove(facility);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Facility removed." });
        }

        // ================================================================
        // ANNOUNCEMENTS
        // ================================================================
        [HttpGet("announcements")]
        public async Task<IActionResult> GetAnnouncements()
        {
            var announcements = await _context.Announcements
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.AnnouncementId,
                    a.Title,
                    a.Content,
                    a.Category,
                    a.Priority,
                    date = a.CreatedAt.ToString("MMM d, yyyy")
                })
                .ToListAsync();

            return Ok(announcements);
        }

        [HttpPost("announcements")]
        public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { message = "Title and content are required." });
            }

            var announcement = new Announcement
            {
                Title = request.Title.Trim(),
                Content = request.Content.Trim(),
                Category = "General",
                Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Announcement published.", announcement.AnnouncementId });
        }

        [HttpDelete("announcements/{id}")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null)
            {
                return NotFound(new { message = "Announcement not found." });
            }

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Announcement deleted." });
        }
    }

    // =====================================
    // REQUEST MODELS
    // =====================================
    public class CreateTrainerRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public int? ExperienceYears { get; set; }
        public string? Bio { get; set; }
    }

    public class CreateClassRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string TrainerName { get; set; } = string.Empty;
        public string ScheduleTime { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
        public string? RoomNumber { get; set; }
        public string? MeetLink { get; set; }
    }

    public class CreateFacilityRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string OpenHours { get; set; } = string.Empty;
    }

    public class CreateAnnouncementRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }
}
