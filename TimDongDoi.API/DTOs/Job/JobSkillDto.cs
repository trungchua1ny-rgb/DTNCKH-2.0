using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Job
{
    /// <summary>
    /// DTO cho skill của job
    /// </summary>
    public class JobSkillDto
    {
        public int Id { get; set; }
        public int JobId { get; set; }
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string? SkillIcon { get; set; }
        public bool IsRequired { get; set; } = true;
        public string? Level { get; set; } // beginner, intermediate, advanced, expert
    }

    /// <summary>
    /// DTO để thêm skill vào job
    /// </summary>
    public class AddJobSkillRequest
    {
        [Required(ErrorMessage = "Skill ID là bắt buộc")]
        public int SkillId { get; set; }

        public bool IsRequired { get; set; } = true;

        public string? Level { get; set; } // beginner, intermediate, advanced, expert
    }
}