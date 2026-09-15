namespace FitSync_API.Models
{
    public class WorkoutExercise
    {
        public int ExerciseId { get; set; }

        public int WorkoutId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Duration { get; set; } = string.Empty; // e.g. "45 sec"

        public int OrderIndex { get; set; }

        public Workout Workout { get; set; } = null!;
    }
}
