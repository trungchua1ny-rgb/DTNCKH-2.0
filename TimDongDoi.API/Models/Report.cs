using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; // Đảm bảo namespace này có mặt

namespace TimDongDoi.API.Models;

public partial class Report
{
    public int Id { get; set; }

    // --- Khóa ngoại (Foreign Keys) ---
    public int ReporterId { get; set; }

    public string? Type { get; set; }

    public int? ReportedUserId { get; set; }

    public int? ReportedJobId { get; set; }

    public int? ReportedReviewId { get; set; }

    public int? ReportedProjectId { get; set; }

    public string Reason { get; set; } = null!;

    public string? Status { get; set; }

    public int? HandledBy { get; set; } // Khóa ngoại tới User (Admin) xử lý

    public string? AdminNote { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    // --- THUỘC TÍNH ĐIỀU HƯỚNG ĐÃ SỬA ---

    // 1. Thêm [NotMapped] cho thuộc tính gây lỗi
    [NotMapped]
    public virtual User? HandledByNavigation { get; set; } 

    // 2. Thêm [NotMapped] cho các thuộc tính User khác (để tránh lỗi tương tự)
    [NotMapped]
    public virtual User? ReportedUser { get; set; }

    [NotMapped]
    public virtual User Reporter { get; set; } = null!;

    // 3. Giữ nguyên các thuộc tính không liên quan đến User (vì chúng không gây lỗi)
    public virtual Job? ReportedJob { get; set; }

    public virtual Project? ReportedProject { get; set; }

    public virtual Review? ReportedReview { get; set; }
}