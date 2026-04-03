using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Admin;

public class DashboardStatsDto
{
    public OverallStatsDto Overall { get; set; } = new();
    public List<MonthlyStatDto> MonthlyStats { get; set; } = new();
    public ApplicationStatsDto ApplicationStats { get; set; } = new();
    public List<TopCompanyDto> TopCompanies { get; set; } = new();
    public List<TopJobDto> TopJobs { get; set; } = new();
}

public class OverallStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalCompanies { get; set; }
    public int TotalJobs { get; set; }
    public int TotalProjects { get; set; }
    public int TotalApplications { get; set; }
    public int ActiveUsers { get; set; }
    public int BannedUsers { get; set; }
    public int PendingVerifications { get; set; }
    public int PendingReports { get; set; }
    public int OpenJobs { get; set; }
    public int OpenProjects { get; set; }
}

public class MonthlyStatDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public int NewUsers { get; set; }
    public int NewJobs { get; set; }
    public int NewProjects { get; set; }
    public int NewApplications { get; set; }
}

public class ApplicationStatsDto
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Reviewing { get; set; }
    public int Interview { get; set; }
    public int Accepted { get; set; }
    public int Rejected { get; set; }
    public double SuccessRate { get; set; }
}

public class TopCompanyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Logo { get; set; }
    public string? Industry { get; set; }
    public int TotalJobs { get; set; }
    public int TotalApplications { get; set; }
}

public class TopJobDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public int Views { get; set; }
    public int Applications { get; set; }
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Avatar { get; set; }
    public string? JobTitle { get; set; }
    public string? BanReason { get; set; }
    public DateTime? BannedUntil { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminUserListResponse
{
    public List<AdminUserDto> Users { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class AdminUserFilterRequest
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AdminCompanyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Logo { get; set; }
    public string? Industry { get; set; }
    public string? Size { get; set; }
    public string VerificationStatus { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public int TotalJobs { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminCompanyListResponse
{
    public List<AdminCompanyDto> Companies { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class AdminJobDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Level { get; set; }
    public string? Status { get; set; }
    public string? Location { get; set; }
    public int Views { get; set; }
    public int Applications { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminJobListResponse
{
    public List<AdminJobDto> Jobs { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class AdminProjectDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CompensationType { get; set; } = string.Empty;
    public int Views { get; set; }
    public int Members { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminProjectListResponse
{
    public List<AdminProjectDto> Projects { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class AdminLogDto
{
    public int Id { get; set; }
    public int AdminId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string? Action { get; set; }
    public string? TargetType { get; set; }
    public int TargetId { get; set; }
    public string? Reason { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminLogListResponse
{
    public List<AdminLogDto> Logs { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class DeleteContentRequest
{
    [Required] public string Reason { get; set; } = string.Empty;
}