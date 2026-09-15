namespace FitSync_API.Models
{
    public class SubscriptionPlan
    {
        public int PlanId { get; set; }

        public string PlanName { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int DurationDays { get; set; }

        public decimal Price { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}