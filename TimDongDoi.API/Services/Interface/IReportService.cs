using TimDongDoi.API.DTOs.Report;

namespace TimDongDoi.API.Services.Interfaces;

public interface IReportService
{
    Task<ReportDto> CreateReport(int reporterId, CreateReportRequest request);
    Task<ReportListResponse> GetMyReports(int userId, int page, int pageSize);
    Task<ReportListResponse> GetAllReports(int page, int pageSize, string? status, string? type);
    Task<ReportDto> GetReportById(int reportId);
    Task<ReportDto> HandleReport(int adminId, int reportId, HandleReportRequest request);
    Task UnbanUser(int adminId, int userId);
    Task<UserStatusDto> GetUserStatus(int userId);
}