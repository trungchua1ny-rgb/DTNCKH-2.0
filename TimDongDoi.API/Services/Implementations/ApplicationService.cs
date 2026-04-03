using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Application;
using TimDongDoi.API.DTOs.Notification;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations
{
    public class ApplicationService : IApplicationService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly INotificationService _notificationService;

        public ApplicationService(AppDbContext context, IWebHostEnvironment env, INotificationService notificationService)
        {
            _context = context;
            _env = env;
            _notificationService = notificationService;
        }

        // ============================================
        // UC13: ỨNG VIÊN ỨNG TUYỂN
        // ============================================

        public async Task<ApplicationDto> ApplyJob(int userId, int jobId, ApplyJobRequest request, IFormFile? cvFile)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.Role != "user")
                throw new UnauthorizedAccessException("Chỉ tài khoản User mới có thể ứng tuyển");

            var job = await _context.Jobs
                .Include(j => j.Company)
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng");

            if (job.Status != "open")
                throw new InvalidOperationException("Tin tuyển dụng này đã đóng hoặc chưa được công khai");

            if (job.Deadline.HasValue)
            {
                var deadline = job.Deadline.Value.ToDateTime(TimeOnly.MinValue);
                if (deadline < DateTime.UtcNow)
                    throw new InvalidOperationException("Tin tuyển dụng đã hết hạn nộp hồ sơ");
            }

            var existingApplication = await _context.Applications
                .FirstOrDefaultAsync(a => a.UserId == userId && a.JobId == jobId);

            if (existingApplication != null)
                throw new InvalidOperationException("Bạn đã ứng tuyển vị trí này rồi");

            string? cvFileUrl = null;
            if (cvFile != null && cvFile.Length > 0)
                cvFileUrl = await UploadCvFile(userId, cvFile);
            else if (!string.IsNullOrEmpty(user.CvFile))
                cvFileUrl = user.CvFile;

            var application = new TimDongDoi.API.Models.Application
            {
                UserId = userId,
                JobId = jobId,
                CoverLetter = request.CoverLetter,
                CvFile = cvFileUrl,
                Status = "pending",
                AppliedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Applications.Add(application);
            await _context.SaveChangesAsync();

            // Phát bài test nếu có
            var jobTests = await _context.JobTests
                .Where(jt => jt.JobId == jobId)
                .ToListAsync();

            if (jobTests.Any())
            {
                var applicationTests = jobTests.Select(jt => new TimDongDoi.API.Models.ApplicationTest
                {
                    ApplicationId = application.Id,
                    TestId = jt.TestId,
                    Status = "pending"
                }).ToList();

                _context.ApplicationTests.AddRange(applicationTests);
                await _context.SaveChangesAsync();
            }

            // ====== THÔNG BÁO ======
            // 1. Chúc mừng ứng viên đã nộp đơn thành công
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "job_application",
                Title = "Ứng tuyển thành công! 🎉",
                Content = $"Bạn đã nộp đơn ứng tuyển vị trí \"{job.Title}\" thành công. Hãy chờ phản hồi từ nhà tuyển dụng nhé!",
                Data = $"{{\"jobId\": {jobId}, \"applicationId\": {application.Id}}}"
            });

            // 2. Thông báo cho company có ứng viên mới
            if (job.Company?.UserId != null)
            {
                await _notificationService.CreateNotification(new CreateNotificationRequest
                {
                    UserId = job.Company.UserId,
                    Type = "job_application",
                    Title = "Có ứng viên mới! 📋",
                    Content = $"{user.FullName} vừa ứng tuyển vào vị trí \"{job.Title}\"",
                    Data = $"{{\"jobId\": {jobId}, \"applicationId\": {application.Id}}}"
                });
            }

            return await GetApplicationById(userId, application.Id);
        }

        // ============================================
        // UC14: USER QUẢN LÝ ĐƠN ỨNG TUYỂN
        // ============================================

        public async Task<List<ApplicationDto>> GetMyApplications(int userId, string? status, int page = 1, int pageSize = 20)
        {
            var query = _context.Applications
                .Include(a => a.Job)
                    .ThenInclude(j => j.Company)
                .Where(a => a.UserId == userId);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(a => a.Status == status);

            var applications = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return applications.Select(a => MapToDto(a, includeJobInfo: true)).ToList();
        }

        public async Task<ApplicationDto> GetApplicationById(int userId, int applicationId)
        {
            var application = await _context.Applications
                .Include(a => a.Job)
                    .ThenInclude(j => j.Company)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId);

            if (application == null)
                throw new KeyNotFoundException("Không tìm thấy đơn ứng tuyển");

            return MapToDto(application, includeJobInfo: true);
        }

        public async Task WithdrawApplication(int userId, int applicationId)
        {
            var application = await _context.Applications
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId);

            if (application == null)
                throw new KeyNotFoundException("Không tìm thấy đơn ứng tuyển");

            if (application.Status != "pending")
                throw new InvalidOperationException("Chỉ có thể rút đơn khi đang ở trạng thái 'Chờ xử lý'");

            var jobTitle = application.Job?.Title ?? "vị trí đã ứng tuyển";
            var jobId = application.JobId;

            _context.Applications.Remove(application);

            if (!string.IsNullOrEmpty(application.CvFile))
                DeleteFile(application.CvFile);

            await _context.SaveChangesAsync();

            // ====== THÔNG BÁO ======
            // Xác nhận ứng viên đã rút đơn
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "job_application",
                Title = "Đã rút đơn ứng tuyển",
                Content = $"Bạn đã rút đơn ứng tuyển vị trí \"{jobTitle}\" thành công.",
                Data = $"{{\"jobId\": {jobId}}}"
            });
        }

        // ============================================
        // UC29-33: COMPANY QUẢN LÝ ỨNG VIÊN
        // ============================================

        public async Task<List<ApplicationDto>> GetJobApplications(int companyUserId, int jobId, string? status, int page = 1, int pageSize = 20)
        {
            await VerifyCompanyOwnsJob(companyUserId, jobId);

            var query = _context.Applications
                .Include(a => a.User)
                .Include(a => a.Job)
                .Where(a => a.JobId == jobId);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(a => a.Status == status);

            var applications = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return applications.Select(a => MapToDto(a, includeUserInfo: true)).ToList();
        }

        public async Task<ApplicationDto> GetApplicationForCompany(int companyUserId, int applicationId)
        {
            var application = await _context.Applications
                .Include(a => a.User)
                .Include(a => a.Job)
                    .ThenInclude(j => j.Company)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                throw new KeyNotFoundException("Không tìm thấy đơn ứng tuyển");

            await VerifyCompanyOwnsJob(companyUserId, application.JobId);

            return MapToDto(application, includeUserInfo: true);
        }

        public async Task<ApplicationDto> UpdateApplicationStatus(int companyUserId, int applicationId, UpdateApplicationStatusRequest request)
        {
            var application = await _context.Applications
                .Include(a => a.User)
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                throw new KeyNotFoundException("Không tìm thấy đơn ứng tuyển");

            await VerifyCompanyOwnsJob(companyUserId, application.JobId);

            var validStatuses = new[] { "pending", "reviewing", "interview", "accepted", "rejected" };
            if (!validStatuses.Contains(request.Status.ToLower()))
                throw new InvalidOperationException("Status không hợp lệ");

            if (request.Status.ToLower() == "rejected" && string.IsNullOrWhiteSpace(request.RejectReason))
                throw new InvalidOperationException("Vui lòng nhập lý do từ chối");

            application.Status = request.Status.ToLower();
            application.RejectReason = request.RejectReason;
            application.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // ====== THÔNG BÁO cho ứng viên ======
            var jobTitle = application.Job?.Title ?? "vị trí ứng tuyển";
            var (title, content) = request.Status.ToLower() switch
            {
                "reviewing" => (
                    "Hồ sơ đang được xem xét 👀",
                    $"Nhà tuyển dụng đang xem xét hồ sơ của bạn cho vị trí \"{jobTitle}\". Hãy chú ý điện thoại nhé!"
                ),
                "interview" => (
                    "Bạn được mời phỏng vấn! 🎉",
                    $"Chúc mừng! Bạn đã vượt qua vòng hồ sơ và được mời phỏng vấn cho vị trí \"{jobTitle}\". Hãy chuẩn bị thật tốt!"
                ),
                "accepted" => (
                    "Chúc mừng! Bạn đã được nhận! 🎊",
                    $"Tuyệt vời! Bạn đã được chấp nhận vào vị trí \"{jobTitle}\". Nhà tuyển dụng sẽ liên hệ với bạn sớm!"
                ),
                "rejected" => (
                    "Kết quả ứng tuyển",
                    $"Rất tiếc, hồ sơ của bạn cho vị trí \"{jobTitle}\" chưa phù hợp lần này. " +
                    (string.IsNullOrEmpty(request.RejectReason) ? "" : $"Lý do: {request.RejectReason}. ") +
                    "Đừng nản lòng, hãy thử các cơ hội khác!"
                ),
                _ => ("Cập nhật trạng thái đơn ứng tuyển", $"Trạng thái đơn ứng tuyển vị trí \"{jobTitle}\" đã được cập nhật.")
            };

            if (application.UserId > 0)
            {
                await _notificationService.CreateNotification(new CreateNotificationRequest
                {
                    UserId = application.UserId,
                    Type = "application_status",
                    Title = title,
                    Content = content,
                    Data = $"{{\"applicationId\": {applicationId}, \"jobId\": {application.JobId}, \"status\": \"{request.Status.ToLower()}\"}}"
                });
            }

            return MapToDto(application, includeUserInfo: true);
        }

        public async Task<ApplicationDto> AcceptApplication(int companyUserId, int applicationId)
        {
            return await UpdateApplicationStatus(companyUserId, applicationId, new UpdateApplicationStatusRequest
            {
                Status = "accepted",
                RejectReason = null
            });
        }

        public async Task<ApplicationDto> RejectApplication(int companyUserId, int applicationId, string reason)
        {
            return await UpdateApplicationStatus(companyUserId, applicationId, new UpdateApplicationStatusRequest
            {
                Status = "rejected",
                RejectReason = reason
            });
        }

        // ============================================
        // STATISTICS
        // ============================================

        public async Task<ApplicationStatsDto> GetJobApplicationStats(int companyUserId, int jobId)
        {
            await VerifyCompanyOwnsJob(companyUserId, jobId);

            var applications = await _context.Applications
                .Where(a => a.JobId == jobId)
                .AsNoTracking()
                .ToListAsync();

            return new ApplicationStatsDto
            {
                Total = applications.Count,
                Pending = applications.Count(a => a.Status == "pending"),
                Reviewing = applications.Count(a => a.Status == "reviewing"),
                Interview = applications.Count(a => a.Status == "interview"),
                Accepted = applications.Count(a => a.Status == "accepted"),
                Rejected = applications.Count(a => a.Status == "rejected")
            };
        }

        // ============================================
        // HELPER METHODS
        // ============================================

        private async Task<string> UploadCvFile(int userId, IFormFile file)
        {
            var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                throw new InvalidOperationException("Chỉ chấp nhận file PDF, DOC, DOCX");

            if (file.Length > 5 * 1024 * 1024)
                throw new InvalidOperationException("Kích thước file không được vượt quá 5MB");

            var fileName = $"cv_{userId}_{Guid.NewGuid()}{extension}";
            var uploadPath = Path.Combine(_env.WebRootPath, "uploads", "cvs");

            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            return $"/uploads/cvs/{fileName}";
        }

        private void DeleteFile(string fileUrl)
        {
            try
            {
                var filePath = Path.Combine(_env.WebRootPath, fileUrl.TrimStart('/'));
                if (File.Exists(filePath))
                    File.Delete(filePath);
            }
            catch { }
        }

        private ApplicationDto MapToDto(TimDongDoi.API.Models.Application application, bool includeJobInfo = false, bool includeUserInfo = false)
        {
            var dto = new ApplicationDto
            {
                Id = application.Id,
                UserId = application.UserId,
                JobId = application.JobId,
                CoverLetter = application.CoverLetter,
                CvFile = application.CvFile,
                Status = application.Status ?? "pending",
                RejectReason = application.RejectReason,
                AppliedAt = application.AppliedAt,
                UpdatedAt = application.UpdatedAt
            };

            if (includeJobInfo && application.Job != null)
            {
                dto.Job = new JobBasicDto
                {
                    Id = application.Job.Id,
                    Title = application.Job.Title,
                    Location = application.Job.Location,
                    Type = application.Job.Type,
                    Level = application.Job.Level,
                    SalaryMin = application.Job.SalaryMin,
                    SalaryMax = application.Job.SalaryMax,
                    Status = application.Job.Status ?? "open",
                    Company = application.Job.Company != null ? new CompanyBasicInfo
                    {
                        Id = application.Job.Company.Id,
                        Name = application.Job.Company.Name,
                        Logo = application.Job.Company.Logo
                    } : null
                };
            }

            if (includeUserInfo && application.User != null)
            {
                dto.User = new UserBasicDto
                {
                    Id = application.User.Id,
                    FullName = application.User.FullName,
                    Email = application.User.Email,
                    Phone = application.User.Phone,
                    Avatar = application.User.Avatar,
                    JobTitle = application.User.JobTitle,
                    SalaryExpectation = application.User.SalaryExpectation
                };
            }

            return dto;
        }

        private async Task<Job> VerifyCompanyOwnsJob(int companyUserId, int jobId)
        {
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == companyUserId);

            if (user == null || user.Role != "company" || user.Company == null)
                throw new UnauthorizedAccessException("Chỉ tài khoản Company mới có thể thực hiện thao tác này");

            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == user.Company.Id);

            if (job == null)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng hoặc bạn không có quyền truy cập");

            return job;
        }
    }
}