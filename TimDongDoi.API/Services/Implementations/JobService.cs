using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Job;
using TimDongDoi.API.DTOs.Notification;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations
{
    public class JobService : IJobService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public JobService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // ============================================
        // UC23 & UC24: CRUD JOBS
        // ============================================

        public async Task<JobDetailDto> CreateJob(int userId, CreateJobRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.Role != "company" || user.Company == null)
            {
                throw new UnauthorizedAccessException("Chỉ tài khoản Company mới có thể tạo tin tuyển dụng");
            }

            // ✅ SỬA 1: Kiểm tra trạng thái linh hoạt cho CreateJob
            var currentStatus = user.Company.VerificationStatus?.ToLower().Trim() ?? "";
            if (currentStatus != "approved" && currentStatus != "verified" && currentStatus != "active")
            {
                throw new InvalidOperationException("Tài khoản doanh nghiệp của bạn đang trong quá trình phê duyệt. Vui lòng quay lại sau khi đã được xác minh!");
            }

            var newJob = new Job
            {
                CompanyId = user.Company.Id,
                Title = request.Title,
                Description = request.Description,
                Requirements = request.Requirements,
                Benefits = request.Benefits,
                Type = request.Type,
                Level = request.Level,
                SalaryMin = request.SalaryMin,
                SalaryMax = request.SalaryMax,
                SalaryCurrency = request.SalaryCurrency,
                Location = request.Location,
                LocationType = request.LocationType,
                Positions = request.Positions,
                Deadline = DateOnly.FromDateTime(request.Deadline),
                Status = request.Status,
                Views = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Jobs.Add(newJob);
            await _context.SaveChangesAsync();

            if (request.Skills != null && request.Skills.Any())
            {
                foreach (var skillRequest in request.Skills)
                {
                    _context.JobSkills.Add(new JobSkill
                    {
                        JobId = newJob.Id,
                        SkillId = skillRequest.SkillId,
                        IsRequired = skillRequest.IsRequired,
                        Level = skillRequest.Level
                    });
                }
                await _context.SaveChangesAsync();
            }

            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "job_created",
                Title = "Tạo tin tuyển dụng thành công! 🎉",
                Content = $"Tin tuyển dụng \"{newJob.Title}\" đã được tạo thành công.",
                Data = $"{{\"jobId\": {newJob.Id}}}"
            });

            return await GetJobById(newJob.Id, userId);
        }

        public async Task<List<JobDto>> GetMyJobs(int userId, string? status, int page = 1, int pageSize = 20)
        {
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.Company == null) throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
                .Include(j => j.Applications)
                .Where(j => j.CompanyId == user.Company.Id);

            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(j => j.Status == status);

            var jobs = await query.OrderByDescending(j => j.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).AsNoTracking().ToListAsync();
            return jobs.Select(MapToJobDto).ToList();
        }

        public async Task<JobDetailDto> GetJobById(int jobId, int? userId = null)
        {
            var job = await _context.Jobs
                .Include(j => j.Company).ThenInclude(c => c.User)
                .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
                .AsNoTracking()
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null) throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng");
            await IncrementViewCount(jobId);

            var dto = MapToJobDetailDto(job);
            if (userId.HasValue)
            {
                dto.IsSaved = await _context.SavedJobs.AnyAsync(sj => sj.UserId == userId.Value && sj.JobId == jobId);
                dto.HasApplied = false; 
            }
            return dto;
        }

        public async Task<JobDetailDto> UpdateJob(int userId, int jobId, UpdateJobRequest request)
        {
            var job = await GetJobByUserAndId(userId, jobId);
            job.Title = request.Title;
            job.Description = request.Description;
            job.Requirements = request.Requirements;
            job.Benefits = request.Benefits;
            job.Type = request.Type;
            job.Level = request.Level;
            job.SalaryMin = request.SalaryMin;
            job.SalaryMax = request.SalaryMax;
            job.SalaryCurrency = request.SalaryCurrency;
            job.Location = request.Location;
            job.LocationType = request.LocationType;
            job.Positions = request.Positions;
            job.Deadline = DateOnly.FromDateTime(request.Deadline);
            job.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetJobById(jobId, userId);
        }

        public async Task DeleteJob(int userId, int jobId)
{
    // 1. Lấy thông tin User và Company để kiểm tra quyền sở hữu
    var user = await _context.Users
        .Include(u => u.Company)
        .FirstOrDefaultAsync(u => u.Id == userId);

    if (user?.Company == null) 
        throw new KeyNotFoundException("Không tìm thấy thông tin công ty.");

    // 2. Tìm tin tuyển dụng kèm theo danh sách ứng tuyển
    var job = await _context.Jobs
        .Include(j => j.Applications)
        .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == user.Company.Id);

    if (job == null) 
        throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng hoặc bạn không có quyền thực hiện.");

    // 3. Kiểm tra ràng buộc ứng viên (Bất kể trạng thái nào để tránh lỗi DB Severed Relationship)
    if (job.Applications.Any())
    {
        // Thông báo trực quan hướng dẫn người dùng sử dụng tính năng Đóng tin
        throw new InvalidOperationException("Không thể xóa tin này vì đã có ứng viên ứng tuyển. Vui lòng sử dụng chức năng 'Đóng tin' để dừng tuyển dụng mà vẫn giữ được lịch sử hồ sơ.");
    }

    // 4. Lưu lại tiêu đề tin trước khi xóa để đưa vào thông báo
    string deletedJobTitle = job.Title;

    // 5. Thực hiện xóa khỏi Database
    _context.Jobs.Remove(job);
    await _context.SaveChangesAsync();

    // 6. ✅ GỬI THÔNG BÁO VÀO HỆ THỐNG (NOTIFICATION)
    // Giúp lưu lại lịch sử trong phần Chuông thông báo
    await _notificationService.CreateNotification(new CreateNotificationRequest
    {
        UserId = userId,
        Type = "job_deleted",
        Title = "Đã xóa tin tuyển dụng 🗑️",
        Content = $"Tin tuyển dụng \"{deletedJobTitle}\" đã được xóa vĩnh viễn khỏi danh sách quản lý.",
        Data = $"{{\"jobId\": {jobId}}}"
    });
}

        // ============================================
        // UC25: SAO CHÉP TIN TUYỂN DỤNG
        // ============================================

        public async Task<JobDetailDto> CloneJob(int userId, int jobId)
        {
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.Company == null) throw new KeyNotFoundException("Không tìm thấy công ty");

            // ✅ SỬA 2: Kiểm tra trạng thái linh hoạt cho CloneJob
            var currentStatus = user.Company.VerificationStatus?.ToLower().Trim() ?? "";
            if (currentStatus != "approved" && currentStatus != "verified" && currentStatus != "active")
            {
                throw new InvalidOperationException("Tài khoản doanh nghiệp của bạn đang trong quá trình phê duyệt. Bạn chưa thể sao chép tin lúc này!");
            }

            var originalJob = await _context.Jobs.Include(j => j.JobSkills)
                .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == user.Company.Id);

            if (originalJob == null) throw new KeyNotFoundException("Không tìm thấy tin gốc");

            var clonedJob = new Job
            {
                CompanyId = originalJob.CompanyId,
                Title = originalJob.Title + " (Copy)",
                Description = originalJob.Description,
                Requirements = originalJob.Requirements,
                Benefits = originalJob.Benefits,
                Type = originalJob.Type,
                Level = originalJob.Level,
                SalaryMin = originalJob.SalaryMin,
                SalaryMax = originalJob.SalaryMax,
                SalaryCurrency = originalJob.SalaryCurrency,
                Location = originalJob.Location,
                LocationType = originalJob.LocationType,
                Positions = originalJob.Positions,
                Deadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                Status = "draft",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Jobs.Add(clonedJob);
            await _context.SaveChangesAsync();

            foreach (var s in originalJob.JobSkills)
            {
                _context.JobSkills.Add(new JobSkill { JobId = clonedJob.Id, SkillId = s.SkillId, IsRequired = s.IsRequired, Level = s.Level });
            }
            await _context.SaveChangesAsync();

            return await GetJobById(clonedJob.Id, userId);
        }

        // ============================================
        // UC26: ĐÓNG/MỞ TIN TUYỂN DỤNG
        // ============================================

        public async Task CloseJob(int userId, int jobId)
        {
            var job = await GetJobByUserAndId(userId, jobId);
            job.Status = "closed";
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task ReopenJob(int userId, int jobId)
        {
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
            
            // ✅ SỬA 3: Kiểm tra trạng thái linh hoạt cho ReopenJob
            var currentStatus = user?.Company?.VerificationStatus?.ToLower().Trim() ?? "";
            if (currentStatus != "approved" && currentStatus != "verified" && currentStatus != "active")
            {
                throw new InvalidOperationException("Tài khoản doanh nghiệp của bạn đang trong quá trình phê duyệt. Không thể mở lại tin!");
            }

            var job = await GetJobByUserAndId(userId, jobId);
            if (job.Deadline.HasValue && job.Deadline.Value.ToDateTime(TimeOnly.MinValue) < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Không thể mở lại tin đã hết hạn. Vui lòng cập nhật deadline trước.");
            }

            job.Status = "open";
            await _context.SaveChangesAsync();
        }

        public async Task PublishJob(int userId, int jobId)
        {
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
            
            // ✅ SỬA 4: Fix lỗi logic và khai báo biến PublishJob
            var currentStatus = user?.Company?.VerificationStatus?.ToLower().Trim() ?? "";
            if (currentStatus != "approved" && currentStatus != "verified" && currentStatus != "active")
            {
                throw new InvalidOperationException("Tài khoản doanh nghiệp của bạn đang chờ Admin phê duyệt. Bạn chưa thể thực hiện thao tác này!");
            }

            var job = await GetJobByUserAndId(userId, jobId);
            if (job.Status != "draft") throw new InvalidOperationException("Chỉ có thể publish tin ở trạng thái draft");

            job.Status = "open";
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // ============================================
        // UC27: THỐNG KÊ TIN TUYỂN DỤNG
        // ============================================

        public async Task<JobStatsDto> GetJobStats(int userId, int jobId)
        {
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.Company == null) throw new KeyNotFoundException("Không tìm thấy công ty");

            var job = await _context.Jobs.Include(j => j.Applications)
                .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == user.Company.Id);
            
            if (job == null) throw new KeyNotFoundException("Không tìm thấy tin");

            return new JobStatsDto
            {
                TotalApplications = job.Applications.Count,
                PendingApplications = job.Applications.Count(a => a.Status == "pending"),
                AcceptedApplications = job.Applications.Count(a => a.Status == "accepted"),
                Views = job.Views ?? 0
            };
        }

        // ============================================
        // QUẢN LÝ SKILLS
        // ============================================

        public async Task<List<JobSkillDto>> GetJobSkills(int jobId)
        {
            var jobSkills = await _context.JobSkills.Include(js => js.Skill).Where(js => js.JobId == jobId).AsNoTracking().ToListAsync();
            return jobSkills.Select(js => new JobSkillDto { Id = js.Id, SkillName = js.Skill?.Name ?? "" }).ToList();
        }

        public async Task<JobSkillDto> AddJobSkill(int userId, int jobId, AddJobSkillRequest request)
        {
            var job = await GetJobByUserAndId(userId, jobId);
            var skill = await _context.Skills.FindAsync(request.SkillId);
            if (skill == null) throw new KeyNotFoundException("Không tìm thấy skill");

            var jobSkill = new JobSkill { JobId = jobId, SkillId = request.SkillId, IsRequired = request.IsRequired, Level = request.Level };
            _context.JobSkills.Add(jobSkill);
            await _context.SaveChangesAsync();

            return new JobSkillDto { Id = jobSkill.Id, SkillName = skill.Name };
        }

        public async Task RemoveJobSkill(int userId, int jobId, int skillId)
        {
            var job = await GetJobByUserAndId(userId, jobId);
            var jobSkill = await _context.JobSkills.FirstOrDefaultAsync(js => js.JobId == jobId && js.SkillId == skillId);
            if (jobSkill != null) { _context.JobSkills.Remove(jobSkill); await _context.SaveChangesAsync(); }
        }

        private async Task<Job> GetJobByUserAndId(int userId, int jobId)
        {
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
            var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == user!.Company!.Id);
            if (job == null) throw new KeyNotFoundException("Không tìm thấy tin hoặc không có quyền");
            return job;
        }

      private JobDto MapToJobDto(Job job)
{
    return new JobDto
    {
        Id = job.Id,
        CompanyId = job.CompanyId,
        Title = job.Title,
        Type = job.Type,
        Level = job.Level,
        SalaryMin = job.SalaryMin,
        SalaryMax = job.SalaryMax,
        SalaryCurrency = job.SalaryCurrency ?? "VND",
        Location = job.Location,
        LocationType = job.LocationType,
        Deadline = job.Deadline.HasValue
            ? job.Deadline.Value.ToDateTime(TimeOnly.MinValue)
            : null,
        Status = job.Status ?? "open",
        Views = job.Views ?? 0,
        CreatedAt = job.CreatedAt,
        Company = job.Company != null ? new CompanyBasicDto
        {
            Id = job.Company.Id,
            Name = job.Company.Name,
            Logo = job.Company.Logo,
            Industry = job.Company.Industry,
            VerificationStatus = job.Company.VerificationStatus
        } : null,
        Skills = job.JobSkills?.Select(js => new JobSkillDto
        {
            Id = js.Id,
            JobId = js.JobId,
            SkillId = js.SkillId,
            SkillName = js.Skill?.Name ?? "",
            IsRequired = js.IsRequired ?? true,
            Level = js.Level
        }).ToList() ?? new List<JobSkillDto>(),
        TotalApplications = job.Applications?.Count ?? 0
    };
}

        private JobDetailDto MapToJobDetailDto(Job job)
        {
            return new JobDetailDto { Id = job.Id, Title = job.Title, Description = job.Description, Status = job.Status ?? "open", Company = job.Company != null ? new CompanyBasicDto { Name = job.Company.Name } : null };
        }

 // Thêm vào cuối file JobService.cs, thay thế các hàm stub rỗng ở cuối class

// ============================================
// SEARCH & FILTER (PUBLIC)
// ============================================

public async Task<List<JobDto>> SearchJobs(
    string? keyword,
    string? location,
    string? type,
    string? level,
    int? salaryMin,
    int? salaryMax,
    string? skills,
    int page = 1,
    int pageSize = 20)
{
    var query = _context.Jobs
        .Include(j => j.Company)
        .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
        .Include(j => j.Applications)
        .Where(j => j.Status == "open")
        .AsQueryable();

    // Filter keyword (title, description, company name)
    if (!string.IsNullOrWhiteSpace(keyword))
    {
        var kw = keyword.ToLower();
        query = query.Where(j =>
            j.Title.ToLower().Contains(kw) ||
            (j.Description != null && j.Description.ToLower().Contains(kw)) ||
            j.Company.Name.ToLower().Contains(kw));
    }

    // Filter location
    if (!string.IsNullOrWhiteSpace(location))
    {
        var loc = location.ToLower();
        query = query.Where(j => j.Location != null && j.Location.ToLower().Contains(loc));
    }

    // Filter type (full-time, part-time, contract, internship, freelance)
    if (!string.IsNullOrWhiteSpace(type))
        query = query.Where(j => j.Type == type);

    // Filter level (intern, fresher, junior, middle, senior, lead)
    if (!string.IsNullOrWhiteSpace(level))
        query = query.Where(j => j.Level == level);

    // Filter salary min
    if (salaryMin.HasValue)
        query = query.Where(j => j.SalaryMax == null || j.SalaryMax >= salaryMin.Value);

    // Filter salary max
    if (salaryMax.HasValue)
        query = query.Where(j => j.SalaryMin == null || j.SalaryMin <= salaryMax.Value);

    // Filter by skill names (comma-separated)
    if (!string.IsNullOrWhiteSpace(skills))
    {
        var skillList = skills.Split(',', StringSplitOptions.RemoveEmptyEntries)
                              .Select(s => s.Trim().ToLower())
                              .ToList();
        query = query.Where(j => j.JobSkills.Any(js =>
            js.Skill != null && skillList.Contains(js.Skill.Name.ToLower())));
    }

    // Exclude expired jobs
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    query = query.Where(j => j.Deadline == null || j.Deadline >= today);

    var jobs = await query
        .OrderByDescending(j => j.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .AsNoTracking()
        .ToListAsync();

    return jobs.Select(MapToJobDto).ToList();
}

public async Task<List<JobDto>> GetFeaturedJobs(int limit = 10)
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);

    var jobs = await _context.Jobs
        .Include(j => j.Company)
        .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
        .Include(j => j.Applications)
        .Where(j => j.Status == "open" && (j.Deadline == null || j.Deadline >= today))
        .OrderByDescending(j => j.Views)
        .ThenByDescending(j => j.CreatedAt)
        .Take(limit)
        .AsNoTracking()
        .ToListAsync();

    return jobs.Select(MapToJobDto).ToList();
}

public async Task<List<JobDto>> GetJobsByCompany(int companyId, int page = 1, int pageSize = 20)
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);

    var jobs = await _context.Jobs
        .Include(j => j.Company)
        .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
        .Include(j => j.Applications)
        .Where(j => j.CompanyId == companyId && j.Status == "open" && (j.Deadline == null || j.Deadline >= today))
        .OrderByDescending(j => j.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .AsNoTracking()
        .ToListAsync();

    return jobs.Select(MapToJobDto).ToList();
}

// ============================================
// SAVED JOBS
// ============================================

public async Task SaveJob(int userId, int jobId)
{
    var job = await _context.Jobs.FindAsync(jobId)
        ?? throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng");

    var already = await _context.SavedJobs
        .AnyAsync(sj => sj.UserId == userId && sj.JobId == jobId);

    if (already)
        throw new InvalidOperationException("Bạn đã lưu tin này rồi");

    _context.SavedJobs.Add(new SavedJob
    {
        UserId = userId,
        JobId = jobId,
        CreatedAt = DateTime.UtcNow
    });

    await _context.SaveChangesAsync();
}

public async Task UnsaveJob(int userId, int jobId)
{
    var saved = await _context.SavedJobs
        .FirstOrDefaultAsync(sj => sj.UserId == userId && sj.JobId == jobId);

    if (saved != null)
    {
        _context.SavedJobs.Remove(saved);
        await _context.SaveChangesAsync();
    }
}

public async Task<List<JobDto>> GetSavedJobs(int userId, int page = 1, int pageSize = 20)
{
    var savedJobs = await _context.SavedJobs
        .Include(sj => sj.Job)
            .ThenInclude(j => j.Company)
        .Include(sj => sj.Job)
            .ThenInclude(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
        .Include(sj => sj.Job)
            .ThenInclude(j => j.Applications)
        .Where(sj => sj.UserId == userId)
        .OrderByDescending(sj => sj.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .AsNoTracking()
        .ToListAsync();

    return savedJobs
        .Where(sj => sj.Job != null)
        .Select(sj => {
            return MapToJobDto(sj.Job!);
        })
        .ToList();
}

        public async Task IncrementViewCount(int jobId)
        {
            var job = await _context.Jobs.FindAsync(jobId);
            if (job != null) { job.Views = (job.Views ?? 0) + 1; await _context.SaveChangesAsync(); }
        }
    }
}