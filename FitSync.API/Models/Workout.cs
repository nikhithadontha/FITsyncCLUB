namespace FitSync_API.Models
{
    public class Workout
    {
        public int WorkoutId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty; // Strength, Cardio, Yoga, HIIT

        public string? Description { get; set; }

        public string Duration { get; set; } = string.Empty; // e.g. "30 min"

        public string Difficulty { get; set; } = "Beginner";

        public int CaloriesBurned { get; set; }

        public string? VideoUrl { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public ICollection<WorkoutExercise> Exercises { get; set; } = new List<WorkoutExercise>();
    }
}
