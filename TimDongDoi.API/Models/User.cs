using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; // Cần thiết cho [NotMapped]

namespace TimDongDoi.API.Models
{
    // Giữ lại 'public partial class User' nếu bạn đã scaffold với nó
    public partial class User
    {
        public int Id { get; set; }

        // --- BẢO MẬT VÀ XÁC THỰC ---
        public string Email { get; set; } = null!;
        public byte[] PasswordHash { get; set; } = null!; 
        public byte[] PasswordSalt { get; set; } = null!; 

        public string Role { get; set; } = "User";
        public string Status { get; set; } = "Active";

        // --- THÔNG TIN CƠ BẢN VÀ HỒ SƠ ---
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
        public string? AboutMe { get; set; }
        public string? Address { get; set; }
        public DateTime? Birthday { get; set; } 
        public string? Gender { get; set; }
        public string? JobTitle { get; set; }
        public int? SalaryExpectation { get; set; }
        public string? CvFile { get; set; }

        // --- THÔNG TIN THỜI GIAN ---
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // --- MỐI QUAN HỆ ĐÃ BỊ LỖI VÀ TIỀM ẨN CẦN THÊM [NotMapped] ---
        
        // ❌ Lỗi hiện tại: MessageFromUsers/MessageToUsers
        public virtual ICollection<Message> MessageFromUsers { get; set; } = new List<Message>();
        public virtual ICollection<Message> MessageToUsers { get; set; } = new List<Message>();

        // ❌ Các mối quan hệ Report đã bị lỗi trước đó
        [NotMapped]
        public virtual ICollection<Report> ReportHandledByNavigations { get; set; } = new List<Report>();
        [NotMapped]
        public virtual ICollection<Report> ReportReportedUsers { get; set; } = new List<Report>();
        [NotMapped]
        public virtual ICollection<Report> ReportReporters { get; set; } = new List<Report>();

        // ❌ Các mối quan hệ Review đã bị lỗi trước đó
        [NotMapped]
        public virtual ICollection<Review> ReviewFromUsers { get; set; } = new List<Review>();
        [NotMapped]
        public virtual ICollection<Review> ReviewToUsers { get; set; } = new List<Review>();

        // --- MỐI QUAN HỆ KHÔNG CẦN SỬA (Thường là quan hệ 1-1, 1-n đơn giản) ---
        // Giữ nguyên các mối quan hệ còn lại mà không thêm [NotMapped]
        public virtual ICollection<AdminLog> AdminLogs { get; set; } = new List<AdminLog>();
        public virtual ICollection<Application> Applications { get; set; } = new List<Application>();
        public virtual Company? Company { get; set; }
        public virtual ICollection<CompanyVerification> CompanyVerifications { get; set; } = new List<CompanyVerification>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<ProjectApplication> ProjectApplications { get; set; } = new List<ProjectApplication>();
        public virtual ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
        public virtual ICollection<SavedJob> SavedJobs { get; set; } = new List<SavedJob>();
        public virtual ICollection<UserEducation> UserEducations { get; set; } = new List<UserEducation>();
        public virtual ICollection<UserExperience> UserExperiences { get; set; } = new List<UserExperience>();
        public virtual ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
        public DateTime? BannedUntil { get; set; }
        public string? BanReason { get; set; }
    }
}