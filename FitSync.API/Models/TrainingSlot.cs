namespace FitSync_API.Models
{
    public class TrainingSlot
    {
        public int SlotId { get; set; }

        public int TrainerId { get; set; }

        public DateTime SlotDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public string TrainingType { get; set; } = string.Empty;

        public string Status { get; set; } = "Available";

        public DateTime CreatedAt { get; set; }

        public Trainer Trainer { get; set; } = null!;
    }
}