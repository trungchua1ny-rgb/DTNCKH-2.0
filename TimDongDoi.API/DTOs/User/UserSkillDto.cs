namespace TimDongDoi.API.DTOs.User
{
    public class UserSkillDto
    {
        public int Id { get; set; }
        public string SkillName { get; set; } = string.Empty; 
        public string? Level { get; set; }
        public decimal? YearsExperience { get; set; }
    }
}