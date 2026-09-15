namespace FitSync_API.Models
{
    public class WorkoutLog
    {
        public int LogId { get; set; }

        public int UserId { get; set; }

        public int WorkoutId { get; set; }

        public DateTime CompletedAt { get; set; }

        public int CaloriesBurned { get; set; }

        public User User { get; set; } = null!;

        public Workout Workout { get; set; } = null!;
    }
}
