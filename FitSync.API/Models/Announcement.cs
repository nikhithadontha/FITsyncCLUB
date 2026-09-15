namespace FitSync_API.Models
{
    public class Announcement
    {
        public int AnnouncementId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public string Category { get; set; } = "General";

        public string Priority { get; set; } = "Medium";

        public DateTime CreatedAt { get; set; }
    }
}
