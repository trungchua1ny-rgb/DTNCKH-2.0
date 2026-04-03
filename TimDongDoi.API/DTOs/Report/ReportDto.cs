using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Report;

public class ReportDto
{
    public int Id { get; set; }
    public int ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string? Type { get; set; }
    public int? ReportedUserId { get; set; }
    public int? ReportedJobId { get; set; }
    public int? ReportedReviewId { get; set; }
    public int? ReportedProjectId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Status { get; set; }
    public int? HandledBy { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class CreateReportRequest
{
    [Required]
    public string Type { get; set; } = string.Empty; // user, job, review, project

    public int? ReportedUserId { get; set; }
    public int? ReportedJobId { get; set; }
    public int? ReportedReviewId { get; set; }
    public int? ReportedProjectId { get; set; }

    [Required][MaxLength(1000)]
    public string Reason { get; set; } = string.Empty;
}

// Gộp handle + ban vào 1 request
public class HandleReportRequest
{
    [Required]
    public string Status { get; set; } = string.Empty; // resolved, dismissed

    public string? AdminNote { get; set; }

    // Chỉ dùng khi Status = "resolved" và Type = "user"
    public BanAction? BanAction { get; set; }
}

public class BanAction
{
    [Required]
    public string Type { get; set; } = string.Empty; // temporary, permanent

    // Số ngày ban, chỉ cần khi Type = "temporary"
    public int? DurationDays { get; set; }

    [Required]
    public string Reason { get; set; } = string.Empty;
}

public class UserStatusDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? BanReason { get; set; }
    public DateTime? BannedUntil { get; set; }
    public bool IsPermanentBan { get; set; }
}

public class ReportListResponse
{
    public List<ReportDto> Reports { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}