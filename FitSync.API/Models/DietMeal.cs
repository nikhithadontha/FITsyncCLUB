namespace FitSync_API.Models
{
    public class DietMeal
    {
        public int MealId { get; set; }

        public int DietPlanId { get; set; }

        public string MealType { get; set; } = string.Empty; // Breakfast, Lunch, Dinner, Snack

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int Calories { get; set; }

        public bool IsVegetarian { get; set; } = true;

        public int OrderIndex { get; set; }

        public DietPlan DietPlan { get; set; } = null!;
    }
}
