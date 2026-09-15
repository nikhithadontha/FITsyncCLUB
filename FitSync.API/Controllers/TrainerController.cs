using FitSync_API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrainerController : ControllerBase
    {
        private readonly FitSyncDbContext _context;

        public TrainerController(FitSyncDbContext context)
        {
            _context = context;
        }


        // ============================
        // GET ALL ACTIVE TRAINERS
        // Optional filter: ?specialization=Yoga
        // ============================
        [HttpGet]
        public async Task<IActionResult> GetTrainers([FromQuery] string? specialization)
        {
            var query = _context.Trainers
                .Where(t => t.IsActive)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(specialization))
            {
                query = query.Where(t =>
                    t.Specialization.ToLower() == specialization.Trim().ToLower());
            }

            var trainers = await query
                .OrderBy(t => t.FullName)
                .Select(t => new
                {
                    t.TrainerId,
                    t.FullName,
                    t.Specialization,
                    t.ExperienceYears,
                    t.Bio,
                    t.ProfileImage
                })
                .ToListAsync();

            return Ok(trainers);
        }


        // ============================
        // GET SINGLE TRAINER
        // ============================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTrainer(int id)
        {
            var trainer = await _context.Trainers
                .Where(t => t.TrainerId == id && t.IsActive)
                .Select(t => new
                {
                    t.TrainerId,
                    t.FullName,
                    t.Specialization,
                    t.ExperienceYears,
                    t.Bio,
                    t.ProfileImage
                })
                .FirstOrDefaultAsync();

            if (trainer == null)
            {
                return NotFound(new { message = "Trainer not found." });
            }

            return Ok(trainer);
        }


        // ============================
        // GET AVAILABLE TRAINING SLOTS FOR A TRAINER
        // Only shows slots that are still open (not booked)
        // ============================
        [HttpGet("{id}/slots")]
        public async Task<IActionResult> GetTrainerSlots(int id)
        {
            try
            {
                var trainerExists = await _context.Trainers
                    .AnyAsync(t => t.TrainerId == id && t.IsActive);

                if (!trainerExists)
                {
                    return NotFound(new { message = "Trainer not found." });
                }

                // Self-heal: if this trainer has no upcoming slots (e.g. the
                // rolling window ran dry), top it up on the fly instead of
                // returning an empty/error result.
                var hasUpcoming = await _context.TrainingSlots
                    .AnyAsync(s => s.TrainerId == id && s.SlotDate >= DateTime.UtcNow.Date);

                if (!hasUpcoming)
                {
                    var trainer = await _context.Trainers.FindAsync(id);
                    if (trainer != null)
                    {
                        TrainingSlotSeeder.TopUpSlotsForTrainer(_context, trainer);
                        await _context.SaveChangesAsync();
                    }
                }

                var slots = await _context.TrainingSlots
                    .Where(s => s.TrainerId == id
                        && s.Status == "Available"
                        && s.SlotDate >= DateTime.UtcNow.Date)
                    .OrderBy(s => s.SlotDate)
                    .ThenBy(s => s.StartTime)
                    .Select(s => new
                    {
                        s.SlotId,
                        s.SlotDate,
                        s.StartTime,
                        s.EndTime,
                        s.TrainingType,
                        s.Status
                    })
                    .ToListAsync();

                return Ok(slots);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Could not load slots.", detail = ex.Message });
            }
        }
    }
}
