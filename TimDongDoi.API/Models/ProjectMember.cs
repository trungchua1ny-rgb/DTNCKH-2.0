using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TimDongDoi.API.Models
{
    [Table("project_members")]
    public class ProjectMember
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("project_id")]
        public int ProjectId { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("position_id")]
        public int? PositionId { get; set; }

        [MaxLength(20)]
        [Column("role_type")]
        public string RoleType { get; set; } = "member";

        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "active";

        [Column("joined_at")]
        public DateOnly JoinedAt { get; set; }

        [Column("left_at")]
        public DateOnly? LeftAt { get; set; }

        // FIX: InverseProperty khớp với collection trong Project, User, ProjectPosition
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("PositionId")]
        public virtual ProjectPosition? Position { get; set; }
    }
}