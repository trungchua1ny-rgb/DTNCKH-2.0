using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TimDongDoi.API.Models
{
    [Table("projects")]
    public class Project
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        [Column("duration_months")]
        public int? DurationMonths { get; set; }

        [MaxLength(20)]
        [Column("location_type")]
        public string LocationType { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("compensation_type")]
        public string CompensationType { get; set; } = string.Empty;

        [Column("compensation_details")]
        public string? CompensationDetails { get; set; }

        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "open";

        [Column("views")]
        public int Views { get; set; } = 0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // FIX: Thêm InverseProperty để EF Core biết đây là FK user_id, không tạo UserId1
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        public virtual ICollection<ProjectApplication> ProjectApplications { get; set; } = new List<ProjectApplication>();
        public virtual ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
        public virtual ICollection<ProjectPosition> ProjectPositions { get; set; } = new List<ProjectPosition>();
    }
}