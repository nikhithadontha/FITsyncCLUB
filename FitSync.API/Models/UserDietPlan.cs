namespace FitSync_API.Models
{
    public class UserDietPlan
    {
        public int UserDietPlanId { get; set; }

        public int UserId { get; set; }

        public int DietPlanId { get; set; }

        public DateTime StartDate { get; set; }

        public string Status { get; set; } = "Active"; // Active, Replaced

        public DateTime CreatedAt { get; set; }

        public User User { get; set; } = null!;

        public DietPlan DietPlan { get; set; } = null!;
    }
}
