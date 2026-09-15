namespace FitSync_API.Models
{
    public class Facility
    {
        public int FacilityId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string OpenHours { get; set; } = string.Empty;

        public string Status { get; set; } = "Open";

        public DateTime CreatedAt { get; set; }
    }
}
