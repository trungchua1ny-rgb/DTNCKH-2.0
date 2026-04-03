using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Report;
using TimDongDoi.API.DTOs.Notification; // ✅ Thêm DTO Notification
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService; // ✅ Thêm Notification Service

    public ReportService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ReportDto> CreateReport(int reporterId, CreateReportRequest request)
    {
        var validTypes = new[] { "user", "job", "review", "project" };
        if (!validTypes.Contains(request.Type))
            throw new InvalidOperationException("Invalid type. Must be: user, job, review, project");

        switch (request.Type)
        {
            case "user":
                if (request.ReportedUserId == null)
                    throw new InvalidOperationException("ReportedUserId is required");
                if (request.ReportedUserId == reporterId)
                    throw new InvalidOperationException("Cannot report yourself");
                if (!await _context.Users.AnyAsync(u => u.Id == request.ReportedUserId))
                    throw new KeyNotFoundException("Reported user not found");
                break;
            case "job":
                if (request.ReportedJobId == null)
                    throw new InvalidOperationException("ReportedJobId is required");
                if (!await _context.Jobs.AnyAsync(j => j.Id == request.ReportedJobId))
                    throw new KeyNotFoundException("Reported job not found");
                break;
            case "review":
                if (request.ReportedReviewId == null)
                    throw new InvalidOperationException("ReportedReviewId is required");
                if (!await _context.Reviews.AnyAsync(r => r.Id == request.ReportedReviewId))
                    throw new KeyNotFoundException("Reported review not found");
                break;
            case "project":
                if (request.ReportedProjectId == null)
                    throw new InvalidOperationException("ReportedProjectId is required");
                if (!await _context.Projects.AnyAsync(p => p.Id == request.ReportedProjectId))
                    throw new KeyNotFoundException("Reported project not found");
                break;
        }

        var alreadyReported = await _context.Reports.AnyAsync(r =>
            r.ReporterId == reporterId &&
            r.Type == request.Type &&
            r.ReportedUserId == request.ReportedUserId &&
            r.ReportedJobId == request.ReportedJobId &&
            r.ReportedReviewId == request.ReportedReviewId &&
            r.ReportedProjectId == request.ReportedProjectId &&
            r.Status == "pending");

        if (alreadyReported)
            throw new InvalidOperationException("You already have a pending report for this item");

        var report = new Report
        {
            ReporterId = reporterId,
            Type = request.Type,
            ReportedUserId = request.ReportedUserId,
            ReportedJobId = request.ReportedJobId,
            ReportedReviewId = request.ReportedReviewId,
            ReportedProjectId = request.ReportedProjectId,
            Reason = request.Reason,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        // ✅ THÔNG BÁO: Xác nhận cho người gửi báo cáo
        await _notificationService.CreateNotification(new CreateNotificationRequest
        {
            UserId = reporterId,
            Type = "report_created",
            Title = "Đã gửi báo cáo! 🛡️",
            Content = $"Yêu cầu báo cáo {request.Type} của bạn đã được gửi tới hệ thống và đang chờ xét duyệt.",
            Data = $"{{\"reportId\": {report.Id}}}"
        });

        var reporter = await _context.Users.FindAsync(reporterId);
        return MapToDto(report, reporter?.FullName ?? string.Empty);
    }

    public async Task<ReportListResponse> GetMyReports(int userId, int page, int pageSize)
    {
        var query = _context.Reports.Where(r => r.ReporterId == userId);
        var totalCount = await query.CountAsync();

        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var reporter = await _context.Users.FindAsync(userId);

        return new ReportListResponse
        {
            Reports = reports.Select(r => MapToDto(r, reporter?.FullName ?? string.Empty)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReportListResponse> GetAllReports(int page, int pageSize, string? status, string? type)
    {
        var query = _context.Reports.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);
        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        var totalCount = await query.CountAsync();

        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var reporterIds = reports.Select(r => r.ReporterId).Distinct().ToList();
        var reporters = await _context.Users
            .Where(u => reporterIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName ?? string.Empty);

        return new ReportListResponse
        {
            Reports = reports.Select(r =>
                MapToDto(r, reporters.GetValueOrDefault(r.ReporterId, string.Empty))).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReportDto> GetReportById(int reportId)
    {
        var report = await _context.Reports.FindAsync(reportId)
            ?? throw new KeyNotFoundException("Report not found");

        var reporter = await _context.Users.FindAsync(report.ReporterId);
        return MapToDto(report, reporter?.FullName ?? string.Empty);
    }

    public async Task<ReportDto> HandleReport(int adminId, int reportId, HandleReportRequest request)
    {
        var validStatuses = new[] { "resolved", "dismissed" };
        if (!validStatuses.Contains(request.Status))
            throw new InvalidOperationException("Status must be: resolved or dismissed");

        var report = await _context.Reports.FindAsync(reportId)
            ?? throw new KeyNotFoundException("Report not found");

        if (report.Status != "pending")
            throw new InvalidOperationException("Report has already been handled");

        // Xử lý ban nếu có BanAction
        if (request.BanAction != null)
        {
            if (report.Type != "user")
                throw new InvalidOperationException("Ban action only applies to reports of type 'user'");

            if (report.ReportedUserId == null)
                throw new InvalidOperationException("No reported user found in this report");

            var validBanTypes = new[] { "temporary", "permanent" };
            if (!validBanTypes.Contains(request.BanAction.Type))
                throw new InvalidOperationException("Ban type must be: temporary or permanent");

            if (request.BanAction.Type == "temporary" && (request.BanAction.DurationDays == null || request.BanAction.DurationDays <= 0))
                throw new InvalidOperationException("DurationDays is required and must be > 0 for temporary ban");

            var userToBan = await _context.Users.FindAsync(report.ReportedUserId)
                ?? throw new KeyNotFoundException("Reported user not found");

            if (userToBan.Status == "banned")
                throw new InvalidOperationException("User is already banned");

            // Thực hiện ban
            userToBan.Status = "banned";
            userToBan.BanReason = request.BanAction.Reason;
            userToBan.BannedUntil = request.BanAction.Type == "permanent"
                ? null 
                : DateTime.UtcNow.AddDays(request.BanAction.DurationDays!.Value);

            // ✅ THÔNG BÁO: Gửi cho người bị khóa tài khoản
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userToBan.Id,
                Type = "account_banned",
                Title = "Thông báo khóa tài khoản 🚫",
                Content = $"Tài khoản của bạn đã bị khóa. Lý do: {request.BanAction.Reason}. Thời hạn: {(userToBan.BannedUntil.HasValue ? userToBan.BannedUntil.Value.ToString("dd/MM/yyyy") : "Vĩnh viễn")}"
            });

            _context.AdminLogs.Add(new AdminLog
            {
                AdminId = adminId,
                Action = request.BanAction.Type == "permanent" ? "ban_permanent" : "ban_temporary",
                TargetType = "user",
                TargetId = report.ReportedUserId.Value,
                Reason = request.BanAction.Reason,
                Metadata = request.BanAction.Type == "temporary"
                    ? $"Duration: {request.BanAction.DurationDays} days, Until: {userToBan.BannedUntil}"
                    : "Permanent ban",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Cập nhật report
        report.Status = request.Status;
        report.HandledBy = adminId;
        report.AdminNote = request.AdminNote;
        report.ResolvedAt = DateTime.UtcNow;

        _context.AdminLogs.Add(new AdminLog
        {
            AdminId = adminId,
            Action = $"handle_report_{request.Status}",
            TargetType = "report",
            TargetId = reportId,
            Reason = request.AdminNote,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // ✅ THÔNG BÁO: Phản hồi kết quả xử lý cho người gửi báo cáo
        await _notificationService.CreateNotification(new CreateNotificationRequest
        {
            UserId = report.ReporterId,
            Type = "report_handled",
            Title = "Báo cáo của bạn đã được xử lý ✅",
            Content = $"Báo cáo loại {report.Type} của bạn đã được Admin xử lý với trạng thái: {request.Status}.",
            Data = $"{{\"reportId\": {report.Id}, \"status\": \"{request.Status}\"}}"
        });

        var reporter = await _context.Users.FindAsync(report.ReporterId);
        return MapToDto(report, reporter?.FullName ?? string.Empty);
    }

    public async Task UnbanUser(int adminId, int userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        if (user.Status != "banned")
            throw new InvalidOperationException("User is not banned");

        user.Status = "active";
        user.BanReason = null;
        user.BannedUntil = null;

        _context.AdminLogs.Add(new AdminLog
        {
            AdminId = adminId,
            Action = "unban_user",
            TargetType = "user",
            TargetId = userId,
            Reason = "User unbanned by admin",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // ✅ THÔNG BÁO: Gửi cho người dùng được mở khóa
        await _notificationService.CreateNotification(new CreateNotificationRequest
        {
            UserId = userId,
            Type = "account_unbanned",
            Title = "Chào mừng bạn trở lại! ✨",
            Content = "Tài khoản của bạn đã được mở khóa bởi Quản trị viên. Giờ bạn có thể truy cập lại dịch vụ."
        });
    }

    public async Task<UserStatusDto> GetUserStatus(int userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        if (user.Status == "banned" && user.BannedUntil.HasValue && user.BannedUntil < DateTime.UtcNow)
        {
            user.Status = "active";
            user.BanReason = null;
            user.BannedUntil = null;
            await _context.SaveChangesAsync();
        }

        return new UserStatusDto
        {
            UserId = user.Id,
            FullName = user.FullName ?? string.Empty,
            Email = user.Email,
            Status = user.Status ?? "active",
            BanReason = user.BanReason,
            BannedUntil = user.BannedUntil,
            IsPermanentBan = user.Status == "banned" && !user.BannedUntil.HasValue
        };
    }

    private static ReportDto MapToDto(Report report, string reporterName) => new()
    {
        Id = report.Id,
        ReporterId = report.ReporterId,
        ReporterName = reporterName,
        Type = report.Type,
        ReportedUserId = report.ReportedUserId,
        ReportedJobId = report.ReportedJobId,
        ReportedReviewId = report.ReportedReviewId,
        ReportedProjectId = report.ReportedProjectId,
        Reason = report.Reason,
        Status = report.Status,
        HandledBy = report.HandledBy,
        AdminNote = report.AdminNote,
        CreatedAt = report.CreatedAt ?? DateTime.UtcNow,
        ResolvedAt = report.ResolvedAt
    };
}