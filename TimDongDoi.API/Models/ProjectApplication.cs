using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TimDongDoi.API.Models
{
    [Table("project_applications")]
    public class ProjectApplication
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("project_id")]
        public int ProjectId { get; set; }

        [Required]
        [Column("position_id")]
        public int PositionId { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("cover_letter")]
        public string CoverLetter { get; set; } = string.Empty;

        [MaxLength(500)]
        [Column("portfolio_link")]
        public string? PortfolioLink { get; set; }

        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "pending";

        [Column("applied_at")]
        public DateTime AppliedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // FIX: InverseProperty khớp với collection trong Project, ProjectPosition, User
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        [ForeignKey("PositionId")]
        public virtual ProjectPosition? Position { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}