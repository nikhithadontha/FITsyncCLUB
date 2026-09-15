namespace FitSync_API.Models
{
    public class UserSubscription
    {
        public int UserSubscriptionId { get; set; }

        public int UserId { get; set; }

        public int PlanId { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; }

        public User User { get; set; } = null!;

        public SubscriptionPlan Plan { get; set; } = null!;
    }
}