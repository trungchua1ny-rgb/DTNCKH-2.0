using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TimDongDoi.API.Models
{
    [Table("user_skills")]
    public partial class UserSkill
    {
        [Key]
        [Column("id")]  
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("skill_id")]
        public int SkillId { get; set; }

        [Column("level")]
        [MaxLength(50)]
        public string? Level { get; set; }

        [Column("years_experience")]
        public decimal? YearsExperience { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("SkillId")]
        public virtual Skill Skill { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}