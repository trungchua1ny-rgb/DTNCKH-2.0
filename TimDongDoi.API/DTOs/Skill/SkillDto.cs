namespace TimDongDoi.API.DTOs.Skill
{
    public class SkillDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Icon { get; set; }
        public int Popularity { get; set; }
    }

    public class AddUserSkillRequest
    {
        public int SkillId { get; set; }
        public string Level { get; set; } = "beginner"; // beginner, intermediate, advanced, expert
        public decimal? YearsExperience { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateUserSkillRequest
    {
        public string Level { get; set; } = "beginner";
        public decimal? YearsExperience { get; set; }
        public string? Description { get; set; }
    }

    public class UserSkillDto
    {
        public int Id { get; set; }
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Icon { get; set; }
        public string Level { get; set; } = string.Empty;
        public decimal? YearsExperience { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}