namespace FitSync_API.Models
{
    public class Trainer
    {
        public int TrainerId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public string Specialization { get; set; } = string.Empty;

        public int ExperienceYears { get; set; }

        public string? Bio { get; set; }

        public string? ProfileImage { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}