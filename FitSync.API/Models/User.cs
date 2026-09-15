namespace FitSync_API.Models
{
    public class User
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public string PasswordHash { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public string Role { get; set; } = "User"; // "User" | "Admin"

        public int? Age { get; set; }

        public string? Gender { get; set; }

        public decimal? HeightCm { get; set; }

        public decimal? WeightKg { get; set; }

        public string? FitnessGoal { get; set; }

        public string? FitnessLevel { get; set; }

        public string? DietPreference { get; set; }

        public string? PreferredWorkout { get; set; }

        public string? ProfileImage { get; set; }

        public bool HasUsedTrial { get; set; } = false;

        public DateTime CreatedAt { get; set; }
    }
}