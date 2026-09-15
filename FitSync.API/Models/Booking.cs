namespace FitSync_API.Models
{
    public class Booking
    {
        public int BookingId { get; set; }

        public int UserId { get; set; }

        public int TrainerId { get; set; }

        public int SlotId { get; set; }

        public DateTime BookingDate { get; set; }

        public string Status { get; set; } = "Confirmed";

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }

        public User User { get; set; } = null!;

        public Trainer Trainer { get; set; } = null!;

        public TrainingSlot TrainingSlot { get; set; } = null!;
    }
}