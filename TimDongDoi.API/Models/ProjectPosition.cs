using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TimDongDoi.API.Models
{
    [Table("project_positions")]
    public class ProjectPosition
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("project_id")]
        public int ProjectId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("role")]
        public string Role { get; set; } = string.Empty;

        [Column("quantity")]
        public int Quantity { get; set; } = 1;

        [Column("requirements")]
        public string? Requirements { get; set; }

        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "open";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        // FIX: InverseProperty khớp với collection trong Project
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }
        public virtual ICollection<ProjectPositionSkill> ProjectPositionSkills { get; set; } = new List<ProjectPositionSkill>();
        public virtual ICollection<ProjectApplication> ProjectApplications { get; set; } = new List<ProjectApplication>();
        public virtual ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
    }
}