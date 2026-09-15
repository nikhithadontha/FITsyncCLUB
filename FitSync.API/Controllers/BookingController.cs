using FitSync_API.Data;
using FitSync_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly FitSyncDbContext _context;

        public BookingController(FitSyncDbContext context)
        {
            _context = context;
        }


        // ============================
        // CREATE BOOKING
        // ============================
        [HttpPost]
        public async Task<IActionResult> CreateBooking(CreateBookingRequest request)
        {
            if (request.UserId <= 0 || request.SlotId <= 0)
            {
                return BadRequest(new { message = "UserId and SlotId are required." });
            }

            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var slot = await _context.TrainingSlots
                .FirstOrDefaultAsync(s => s.SlotId == request.SlotId);

            if (slot == null)
            {
                return NotFound(new { message = "Training slot not found." });
            }

            if (slot.Status != "Available")
            {
                return Conflict(new { message = "This slot has already been booked." });
            }

            // Lock the slot
            slot.Status = "Booked";

            var booking = new Booking
            {
                UserId = request.UserId,
                TrainerId = slot.TrainerId,
                SlotId = slot.SlotId,
                BookingDate = DateTime.UtcNow,
                Status = "Confirmed",
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Booking confirmed.",
                bookingId = booking.BookingId
            });
        }


        // ============================
        // GET A USER'S BOOKINGS
        // ============================
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserBookings(int userId)
        {
            var bookings = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Include(b => b.Trainer)
                .Include(b => b.TrainingSlot)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    b.BookingId,
                    b.Status,
                    b.Notes,
                    b.CreatedAt,
                    TrainerName = b.Trainer.FullName,
                    Specialization = b.Trainer.Specialization,
                    SlotDate = b.TrainingSlot.SlotDate,
                    StartTime = b.TrainingSlot.StartTime,
                    EndTime = b.TrainingSlot.EndTime,
                    TrainingType = b.TrainingSlot.TrainingType
                })
                .ToListAsync();

            return Ok(bookings);
        }


        // ============================
        // GET A USER'S BOOKINGS (dashboard / profile "My Bookings" widget)
        // Shape expected by wwwroot/js/dashboard.js and wwwroot/js/profile.js:
        //   { classes: [...], trainers: [...] }
        // Note: there is currently no way in the UI to create a class
        // booking (the class cards on the dashboard are "coming soon"
        // placeholders), so "classes" is always empty for now - that is
        // expected, not a bug. Once a class-booking flow is added, populate
        // it the same way as "trainers" below.
        // ============================
        [HttpGet("my-bookings/{userId}")]
        public async Task<IActionResult> GetMyBookings(int userId)
        {
            var trainerBookings = await _context.Bookings
                .Where(b => b.UserId == userId && b.Status != "Cancelled")
                .Include(b => b.Trainer)
                .Include(b => b.TrainingSlot)
                .OrderBy(b => b.TrainingSlot.SlotDate)
                .ThenBy(b => b.TrainingSlot.StartTime)
                .Select(b => new
                {
                    bookingId = b.BookingId,
                    trainerId = b.TrainerId,
                    trainerName = b.Trainer.FullName,
                    trainer = b.Trainer.FullName,
                    specialization = b.Trainer.Specialization,
                    slotDate = b.TrainingSlot.SlotDate,
                    startTime = b.TrainingSlot.StartTime,
                    endTime = b.TrainingSlot.EndTime,
                    date = b.TrainingSlot.SlotDate.ToString("MMM d, yyyy"),
                    time = b.TrainingSlot.StartTime.ToString(@"hh\:mm") + " - " + b.TrainingSlot.EndTime.ToString(@"hh\:mm"),
                    facility = "FitSync Studio",
                    status = b.Status
                })
                .ToListAsync();

            return Ok(new
            {
                classes = Array.Empty<object>(),
                trainers = trainerBookings
            });
        }


        // ============================
        // CANCEL BOOKING
        // Re-opens the underlying slot for others to book
        // ============================
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.TrainingSlot)
                .FirstOrDefaultAsync(b => b.BookingId == id);

            if (booking == null)
            {
                return NotFound(new { message = "Booking not found." });
            }

            if (booking.Status == "Cancelled")
            {
                return BadRequest(new { message = "Booking is already cancelled." });
            }

            booking.Status = "Cancelled";

            if (booking.TrainingSlot != null)
            {
                booking.TrainingSlot.Status = "Available";
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Booking cancelled." });
        }
    }


    // =====================================
    // CREATE BOOKING REQUEST MODEL
    // =====================================
    public class CreateBookingRequest
    {
        public int UserId { get; set; }

        public int SlotId { get; set; }

        public string? Notes { get; set; }
    }
}
