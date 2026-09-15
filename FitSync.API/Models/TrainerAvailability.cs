namespace FitSync_API.Models
{
    public class TrainerAvailability
    {
        public int AvailabilityId { get; set; }

        public int TrainerId { get; set; }

        public DateTime AvailableDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public bool IsAvailable { get; set; }

        public DateTime CreatedAt { get; set; }

        public Trainer Trainer { get; set; } = null!;
    }
}