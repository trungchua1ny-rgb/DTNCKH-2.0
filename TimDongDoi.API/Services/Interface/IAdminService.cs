using TimDongDoi.API.DTOs.Admin;

namespace TimDongDoi.API.Services.Interfaces;

public interface IAdminService
{
    // Dashboard
    Task<DashboardStatsDto> GetDashboardStats();
    Task<List<MonthlyStatDto>> GetMonthlyStats(int months);

    // User management
    Task<AdminUserListResponse> GetUsers(AdminUserFilterRequest filter);
    Task<AdminUserDto> GetUserById(int userId);

    // Company management
    Task<AdminCompanyListResponse> GetCompanies(string? search, string? verificationStatus, int page, int pageSize);

    // Job management
    Task<AdminJobListResponse> GetJobs(string? search, string? status, int page, int pageSize);
    Task DeleteJob(int adminId, int jobId, string reason);

    // Project management
    Task<AdminProjectListResponse> GetProjects(string? search, string? status, int page, int pageSize);
    Task DeleteProject(int adminId, int projectId, string reason);

    // Admin logs
    Task<AdminLogListResponse> GetAdminLogs(int page, int pageSize, string? action);

    // Export
    Task<byte[]> ExportUsersCsv();
    Task<byte[]> ExportJobsCsv();
}