namespace FitSync_API.Models
{
    public class DietPlan
    {
        public int DietPlanId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Goal { get; set; } = string.Empty; // Weight Loss, Muscle Gain, Maintenance

        public string? Description { get; set; }

        public int DailyCalories { get; set; }

        public int ProteinGrams { get; set; }

        public int CarbsGrams { get; set; }

        public int FatGrams { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public ICollection<DietMeal> Meals { get; set; } = new List<DietMeal>();
    }
}
