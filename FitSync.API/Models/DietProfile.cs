namespace FitSync_API.Models
{
    public class DietProfile
    {
        public int ProfileId { get; set; }

        public int UserId { get; set; }

        public int Age { get; set; }

        public decimal HeightCm { get; set; }

        public decimal WeightKg { get; set; }

        public string Gender { get; set; } = string.Empty; // Male, Female

        public string DietaryPreference { get; set; } = string.Empty; // Veg, NonVeg

        public string Goal { get; set; } = string.Empty; // Weight Loss, Muscle Gain, Maintenance

        // Computed at save time using the Mifflin-St Jeor equation
        public decimal Bmr { get; set; }

        public decimal Tdee { get; set; }

        public int RecommendedCalories { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public User User { get; set; } = null!;
    }
}
