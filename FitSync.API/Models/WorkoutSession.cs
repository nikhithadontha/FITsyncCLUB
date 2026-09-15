namespace FitSync_API.Models
{
    public class WorkoutSession
    {
        public int SessionId { get; set; }

        public int UserId { get; set; }

        public int WorkoutId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime LastActivityTime { get; set; }

        public int CompletedDuration { get; set; } // in seconds

        public int RemainingDuration { get; set; } // in seconds

        public int RequiredDuration { get; set; } // in seconds

        public string Status { get; set; } = "Not Started"; // Scheduled, Not Started, In Progress, Paused, Incomplete, Completed, Cancelled

        public int CaloriesBurned { get; set; }

        public User User { get; set; } = null!;

        public Workout Workout { get; set; } = null!;
    }
}
