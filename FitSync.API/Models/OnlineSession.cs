namespace FitSync_API.Models
{
    public class OnlineSession
    {
        public int SessionId { get; set; }

        public int BookingId { get; set; }

        public string? MeetingLink { get; set; }

        public DateTime SessionDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public string SessionStatus { get; set; } = "Scheduled";

        public DateTime CreatedAt { get; set; }

        public Booking Booking { get; set; } = null!;
    }
}