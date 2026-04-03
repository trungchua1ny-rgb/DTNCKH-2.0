using Microsoft.EntityFrameworkCore;
using System.Text;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Admin;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;

    public AdminService(AppDbContext context)
    {
        _context = context;
    }

    // ==================== DASHBOARD ====================

    public async Task<DashboardStatsDto> GetDashboardStats()
    {
        var overall = new OverallStatsDto
        {
            TotalUsers        = await _context.Users.CountAsync(),
            TotalCompanies    = await _context.Companies.CountAsync(),
            TotalJobs         = await _context.Jobs.CountAsync(),
            TotalProjects     = await _context.Projects.CountAsync(),
            TotalApplications = await _context.Applications.CountAsync(),
            ActiveUsers       = await _context.Users.CountAsync(u => u.Status == "active"),
            BannedUsers       = await _context.Users.CountAsync(u => u.Status == "banned"),
            PendingVerifications = await _context.CompanyVerifications.CountAsync(v => v.Status == "pending"),
            PendingReports    = await _context.Reports.CountAsync(r => r.Status == "pending"),
            OpenJobs          = await _context.Jobs.CountAsync(j => j.Status == "open"),
            OpenProjects      = await _context.Projects.CountAsync(p => p.Status == "open")
        };

        // Application stats
        var appTotal    = await _context.Applications.CountAsync();
        var appAccepted = await _context.Applications.CountAsync(a => a.Status == "accepted");
        var appStats = new TimDongDoi.API.DTOs.Admin.ApplicationStatsDto
        {
            Total     = appTotal,
            Pending   = await _context.Applications.CountAsync(a => a.Status == "pending"),
            Reviewing = await _context.Applications.CountAsync(a => a.Status == "reviewing"),
            Interview = await _context.Applications.CountAsync(a => a.Status == "interview"),
            Accepted  = appAccepted,
            Rejected  = await _context.Applications.CountAsync(a => a.Status == "rejected"),
            SuccessRate = appTotal > 0 ? Math.Round((double)appAccepted / appTotal * 100, 1) : 0
        };

        // Top companies by applications
        var topCompanies = await _context.Companies
            .Select(c => new TopCompanyDto
            {
                Id               = c.Id,
                Name             = c.Name,
                Logo             = c.Logo,
                Industry         = c.Industry,
                TotalJobs        = c.Jobs.Count,
                TotalApplications = c.Jobs.Sum(j => j.Applications.Count)
            })
            .OrderByDescending(c => c.TotalApplications)
            .Take(5)
            .ToListAsync();

        // Top jobs by views
        var topJobs = await _context.Jobs
            .Select(j => new TopJobDto
            {
                Id           = j.Id,
                Title        = j.Title,
                CompanyName  = j.Company.Name,
                Views        = j.Views ?? 0,
                Applications = j.Applications.Count
            })
            .OrderByDescending(j => j.Views)
            .Take(5)
            .ToListAsync();

        var monthlyStats = await GetMonthlyStats(6);

        return new DashboardStatsDto
        {
            Overall         = overall,
            MonthlyStats    = monthlyStats,
            ApplicationStats = appStats,
            TopCompanies    = topCompanies,
            TopJobs         = topJobs
        };
    }

    public async Task<List<MonthlyStatDto>> GetMonthlyStats(int months)
    {
        var result = new List<MonthlyStatDto>();
        var now = DateTime.UtcNow;

        for (int i = months - 1; i >= 0; i--)
        {
            var date  = now.AddMonths(-i);
            var year  = date.Year;
            var month = date.Month;
            var start = new DateTime(year, month, 1);
            var end   = start.AddMonths(1);

            result.Add(new MonthlyStatDto
            {
                Year            = year,
                Month           = month,
                MonthName       = date.ToString("MMM yyyy"),
                NewUsers        = await _context.Users.CountAsync(u => u.CreatedAt >= start && u.CreatedAt < end),
                NewJobs         = await _context.Jobs.CountAsync(j => j.CreatedAt >= start && j.CreatedAt < end),
                NewProjects     = await _context.Projects.CountAsync(p => p.CreatedAt >= start && p.CreatedAt < end),
                NewApplications = await _context.Applications.CountAsync(a => a.AppliedAt >= start && a.AppliedAt < end)
            });
        }

        return result;
    }

    // ==================== USER MANAGEMENT ====================

    public async Task<AdminUserListResponse> GetUsers(AdminUserFilterRequest filter)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(u =>
                u.FullName.Contains(filter.Search) ||
                u.Email.Contains(filter.Search));

        if (!string.IsNullOrEmpty(filter.Role))
            query = query.Where(u => u.Role == filter.Role);

        if (!string.IsNullOrEmpty(filter.Status))
            query = query.Where(u => u.Status == filter.Status);

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(u => new AdminUserDto
            {
                Id         = u.Id,
                Email      = u.Email,
                FullName   = u.FullName,
                Role       = u.Role,
                Status     = u.Status,
                Phone      = u.Phone,
                Avatar     = u.Avatar,
                JobTitle   = u.JobTitle,
                CreatedAt  = u.CreatedAt
            })
            .ToListAsync();

        return new AdminUserListResponse
        {
            Users      = users,
            TotalCount = totalCount,
            Page       = filter.Page,
            PageSize   = filter.PageSize
        };
    }

    public async Task<AdminUserDto> GetUserById(int userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found");

        return new AdminUserDto
        {
            Id        = user.Id,
            Email     = user.Email,
            FullName  = user.FullName,
            Role      = user.Role,
            Status    = user.Status,
            Phone     = user.Phone,
            Avatar    = user.Avatar,
            JobTitle  = user.JobTitle,
            CreatedAt = user.CreatedAt
        };
    }

    // ==================== COMPANY MANAGEMENT ====================

    public async Task<AdminCompanyListResponse> GetCompanies(
        string? search, string? verificationStatus, int page, int pageSize)
    {
        var query = _context.Companies.Include(c => c.User).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search));

        if (!string.IsNullOrEmpty(verificationStatus))
            query = query.Where(c => c.VerificationStatus == verificationStatus);

        var totalCount = await query.CountAsync();

        var companies = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCompanyDto
            {
                Id                 = c.Id,
                Name               = c.Name,
                Logo               = c.Logo,
                Industry           = c.Industry,
                Size               = c.Size,
                VerificationStatus = c.VerificationStatus ?? "unverified",
                OwnerEmail         = c.User.Email,
                TotalJobs          = c.Jobs.Count,
                CreatedAt          = c.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new AdminCompanyListResponse
        {
            Companies  = companies,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize
        };
    }

    // ==================== JOB MANAGEMENT ====================

    public async Task<AdminJobListResponse> GetJobs(
        string? search, string? status, int page, int pageSize)
    {
        var query = _context.Jobs.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(j => j.Title.Contains(search));

        if (!string.IsNullOrEmpty(status))
            query = query.Where(j => j.Status == status);

        var totalCount = await query.CountAsync();

        var jobs = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new AdminJobDto
            {
                Id           = j.Id,
                Title        = j.Title,
                CompanyName  = j.Company.Name,
                Type         = j.Type,
                Level        = j.Level,
                Status       = j.Status,
                Location     = j.Location,
                Views        = j.Views ?? 0,
                Applications = j.Applications.Count,
                CreatedAt    = j.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new AdminJobListResponse
        {
            Jobs       = jobs,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize
        };
    }

   public async Task DeleteJob(int adminId, int jobId, string reason)
    {
        var job = await _context.Jobs.FindAsync(jobId)
            ?? throw new KeyNotFoundException("Job not found");

        // 1. DỌN DẸP ĐƠN ỨNG TUYỂN (Applications)
        var applications = await _context.Applications.Where(a => a.JobId == jobId).ToListAsync();
        if (applications.Any())
        {
            _context.Applications.RemoveRange(applications);
        }

        // 2. DỌN DẸP BÁO CÁO VI PHẠM (Reports)
        // Cực kỳ quan trọng vì hệ thống của bạn cho phép report Job
        var reports = await _context.Reports.Where(r => r.ReportedJobId == jobId).ToListAsync();
        if (reports.Any())
        {
            _context.Reports.RemoveRange(reports);
        }

        // 3. (Tùy chọn) DỌN DẸP KỸ NĂNG YÊU CẦU (JobSkills - Mở comment nếu DB bạn có bảng này)
        /*
        var jobSkills = await _context.JobSkills.Where(js => js.JobId == jobId).ToListAsync();
        if (jobSkills.Any()) _context.JobSkills.RemoveRange(jobSkills);
        */

        // 4. (Tùy chọn) DỌN DẸP VIỆC LÀM ĐÃ LƯU (SavedJobs - Mở comment nếu DB bạn có bảng này)
        /*
        var savedJobs = await _context.SavedJobs.Where(sj => sj.JobId == jobId).ToListAsync();
        if (savedJobs.Any()) _context.SavedJobs.RemoveRange(savedJobs);
        */

        // 5. CHỐT HẠ: XÓA TIN TUYỂN DỤNG GỐC
        _context.Jobs.Remove(job);

        // 6. GHI LOG ADMIN
        _context.AdminLogs.Add(new AdminLog
        {
            AdminId    = adminId,
            Action     = "delete_job",
            TargetType = "job",
            TargetId   = jobId,
            Reason     = reason,
            CreatedAt  = DateTime.UtcNow
        });

        // Chạy tất cả lệnh xóa cùng lúc an toàn
        await _context.SaveChangesAsync();
    }

    // ==================== PROJECT MANAGEMENT ====================

    public async Task<AdminProjectListResponse> GetProjects(
        string? search, string? status, int page, int pageSize)
    {
        var query = _context.Projects.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Title.Contains(search));

        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);

        var totalCount = await query.CountAsync();

        var projects = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.User)
            .Include(p => p.ProjectMembers)
            .Select(p => new AdminProjectDto
            {
                Id               = p.Id,
                Title            = p.Title,
                OwnerName        = p.User != null ? p.User.FullName : string.Empty,
                Type             = p.Type,
                Status           = p.Status,
                CompensationType = p.CompensationType,
                Views            = p.Views,
                Members          = p.ProjectMembers.Count(m => m.Status == "active"),
                CreatedAt        = p.CreatedAt
            })
            .ToListAsync();

        return new AdminProjectListResponse
        {
            Projects   = projects,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize
        };
    }

   public async Task DeleteProject(int adminId, int projectId, string reason)
    {
        var project = await _context.Projects.FindAsync(projectId)
            ?? throw new KeyNotFoundException("Project not found");

        // 1. DỌN VỊ TRÍ & ĐƠN ỨNG TUYỂN
        var positions = await _context.ProjectPositions.Where(p => p.ProjectId == projectId).ToListAsync();
        foreach (var pos in positions)
        {
            var applications = await _context.ProjectApplications.Where(a => a.PositionId == pos.Id).ToListAsync();
            if (applications.Any()) _context.ProjectApplications.RemoveRange(applications);
        }
        if (positions.Any()) _context.ProjectPositions.RemoveRange(positions);

        // 2. DỌN THÀNH VIÊN & CÁC ĐÁNH GIÁ (REVIEWS) CỦA THÀNH VIÊN ĐÓ
        var members = await _context.ProjectMembers.Where(m => m.ProjectId == projectId).ToListAsync();
        if (members.Any())
        {
            // Lấy ra danh sách ID của các thành viên
            var memberIds = members.Select(m => m.Id).ToList();

            // Tìm và xóa các Review liên quan đến các thành viên này
            var reviews = await _context.Reviews
                .Where(r => r.ProjectMemberId != null && memberIds.Contains((int)r.ProjectMemberId))
                .ToListAsync();
            
            if (reviews.Any()) _context.Reviews.RemoveRange(reviews);

            // Xong xuôi mới xóa Thành viên
            _context.ProjectMembers.RemoveRange(members);
        }

        // 3. (Phòng hờ) DỌN CÁC BÁO CÁO VI PHẠM (REPORTS) LIÊN QUAN ĐẾN PROJECT NÀY
        var reports = await _context.Reports.Where(r => r.ReportedProjectId == projectId).ToListAsync();
        if (reports.Any()) _context.Reports.RemoveRange(reports);

        // 4. CHỐT HẠ: XÓA DỰ ÁN GỐC
        _context.Projects.Remove(project);

        // 5. GHI LOG
        _context.AdminLogs.Add(new AdminLog
        {
            AdminId    = adminId,
            Action     = "delete_project",
            TargetType = "project",
            TargetId   = projectId,
            Reason     = reason,
            CreatedAt  = DateTime.UtcNow
        });

        // Đẩy toàn bộ thay đổi xuống Database
        await _context.SaveChangesAsync();
    }

    // ==================== ADMIN LOGS ====================

    public async Task<AdminLogListResponse> GetAdminLogs(int page, int pageSize, string? action)
    {
        var query = _context.AdminLogs.AsQueryable();

        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action == action);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(l => l.Admin)
            .Select(l => new AdminLogDto
            {
                Id         = l.Id,
                AdminId    = l.AdminId,
                AdminName  = l.Admin.FullName,
                Action     = l.Action,
                TargetType = l.TargetType,
                TargetId   = l.TargetId,
                Reason     = l.Reason,
                Metadata   = l.Metadata,
                CreatedAt  = l.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new AdminLogListResponse
        {
            Logs       = logs,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize
        };
    }

    // ==================== EXPORT CSV ====================

    public async Task<byte[]> ExportUsersCsv()
    {
        var users = await _context.Users
            .OrderBy(u => u.Id)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Email,FullName,Role,Status,Phone,JobTitle,CreatedAt");

        foreach (var u in users)
        {
            sb.AppendLine($"{u.Id}," +
                $"\"{u.Email}\"," +
                $"\"{u.FullName}\"," +
                $"{u.Role}," +
                $"{u.Status}," +
                $"\"{u.Phone ?? ""}\"," +
                $"\"{u.JobTitle ?? ""}\"," +
                $"{u.CreatedAt:yyyy-MM-dd}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportJobsCsv()
    {
        var jobs = await _context.Jobs
            .Include(j => j.Company)
            .OrderBy(j => j.Id)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Title,Company,Type,Level,Status,Location,Views,CreatedAt");

        foreach (var j in jobs)
        {
            sb.AppendLine($"{j.Id}," +
                $"\"{j.Title}\"," +
                $"\"{j.Company.Name}\"," +
                $"{j.Type ?? ""}," +
                $"{j.Level ?? ""}," +
                $"{j.Status ?? ""}," +
                $"\"{j.Location ?? ""}\"," +
                $"{j.Views ?? 0}," +
                $"{j.CreatedAt:yyyy-MM-dd}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}