namespace FitSync_API.Models
{
    // Admin-managed fitness class listing (Strength/Yoga/HIIT/etc.)
    // Table name is "ClassSchedules" to avoid clashing with the C# "class" keyword.
    public class ClassSchedule
    {
        public int ClassId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string TrainerName { get; set; } = string.Empty;

        public string ScheduleTime { get; set; } = string.Empty;

        public bool IsOnline { get; set; }

        public string? RoomNumber { get; set; }

        public string? MeetLink { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }
    }
}
