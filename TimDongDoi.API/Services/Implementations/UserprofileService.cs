using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Notification;
using TimDongDoi.API.DTOs.User;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations
{
    public class UserProfileService : IUserProfileService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly INotificationService _notificationService;

        public UserProfileService(AppDbContext context, IWebHostEnvironment env, INotificationService notificationService)
        {
            _context = context;
            _env = env;
            _notificationService = notificationService;
        }

        // ===== UPLOAD HELPERS =====

        private async Task<string> SaveFile(IFormFile file, string folder)
        {
            var allowedImages = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var allowedDocs = new[] { ".pdf", ".doc", ".docx" };
            var ext = Path.GetExtension(file.FileName).ToLower();

            if (folder == "avatars" && !allowedImages.Contains(ext))
                throw new InvalidOperationException("Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png, .webp)");

            if (folder == "cvs" && !allowedDocs.Contains(ext))
                throw new InvalidOperationException("Chỉ chấp nhận file PDF hoặc Word (.pdf, .doc, .docx)");

            if (file.Length > 5 * 1024 * 1024)
                throw new InvalidOperationException("File không được vượt quá 5MB");

            var uploadPath = Path.Combine(_env.WebRootPath, "uploads", folder);
            Directory.CreateDirectory(uploadPath);

            var fileName = $"{folder.TrimEnd('s')}_{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadPath, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return $"/uploads/{folder}/{fileName}";
        }

        // ===== UPLOAD AVATAR =====

        public async Task<string> UploadAvatar(int userId, IFormFile file)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            var path = await SaveFile(file, "avatars");

            if (!string.IsNullOrEmpty(user.Avatar))
            {
                var oldPath = Path.Combine(_env.WebRootPath, user.Avatar.TrimStart('/'));
                if (File.Exists(oldPath)) File.Delete(oldPath);
            }

            user.Avatar = path;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return path;
        }

        // ===== UPLOAD CV =====

        public async Task<string> UploadCv(int userId, IFormFile file)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            var path = await SaveFile(file, "cvs");

            user.CvFile = path;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Thông báo upload CV thành công
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "system",
                Title = "CV đã được cập nhật 📄",
                Content = "CV của bạn đã được tải lên thành công. Nhà tuyển dụng có thể xem CV này khi bạn ứng tuyển.",
                Data = $"{{\"cvFile\": \"{path}\"}}"
            });

            return path;
        }

        // ===== EXPERIENCES =====

        public async Task<List<UserExperienceDto>> GetExperiences(int userId)
        {
            return await _context.UserExperiences
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.IsCurrent)
                .ThenByDescending(e => e.StartDate)
                .Select(e => MapExperience(e))
                .ToListAsync();
        }

        public async Task<UserExperienceDto> AddExperience(int userId, UserExperienceRequest request)
        {
            var exp = new UserExperience
            {
                UserId = userId,
                CompanyName = request.CompanyName,
                Position = request.Position,
                StartDate = ParseDate(request.StartDate),
                EndDate = request.IsCurrent ? null : ParseDate(request.EndDate),
                IsCurrent = request.IsCurrent,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserExperiences.Add(exp);
            await _context.SaveChangesAsync();

            return MapExperience(exp);
        }

        public async Task<UserExperienceDto> UpdateExperience(int userId, int id, UserExperienceRequest request)
        {
            var exp = await _context.UserExperiences
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy kinh nghiệm.");

            exp.CompanyName = request.CompanyName;
            exp.Position = request.Position;
            exp.StartDate = ParseDate(request.StartDate);
            exp.EndDate = request.IsCurrent ? null : ParseDate(request.EndDate);
            exp.IsCurrent = request.IsCurrent;
            exp.Description = request.Description;

            await _context.SaveChangesAsync();
            return MapExperience(exp);
        }

        public async Task DeleteExperience(int userId, int id)
        {
            var exp = await _context.UserExperiences
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy kinh nghiệm.");

            _context.UserExperiences.Remove(exp);
            await _context.SaveChangesAsync();
        }

        // ===== EDUCATIONS =====

        public async Task<List<UserEducationDto>> GetEducations(int userId)
        {
            return await _context.UserEducations
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.EndYear)
                .Select(e => MapEducation(e))
                .ToListAsync();
        }

        public async Task<UserEducationDto> AddEducation(int userId, UserEducationRequest request)
        {
            var edu = new UserEducation
            {
                UserId = userId,
                SchoolName = request.SchoolName,
                Major = request.Major,
                Degree = request.Degree,
                StartYear = request.StartYear,
                EndYear = request.EndYear,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserEducations.Add(edu);
            await _context.SaveChangesAsync();

            return MapEducation(edu);
        }

        public async Task<UserEducationDto> UpdateEducation(int userId, int id, UserEducationRequest request)
        {
            var edu = await _context.UserEducations
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy học vấn.");

            edu.SchoolName = request.SchoolName;
            edu.Major = request.Major;
            edu.Degree = request.Degree;
            edu.StartYear = request.StartYear;
            edu.EndYear = request.EndYear;
            edu.Description = request.Description;

            await _context.SaveChangesAsync();
            return MapEducation(edu);
        }

        public async Task DeleteEducation(int userId, int id)
        {
            var edu = await _context.UserEducations
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy học vấn.");

            _context.UserEducations.Remove(edu);
            await _context.SaveChangesAsync();
        }

        // ===== MAPPERS =====

        private static UserExperienceDto MapExperience(UserExperience e) => new()
        {
            Id = e.Id,
            CompanyName = e.CompanyName,
            Position = e.Position,
            StartDate = e.StartDate?.ToString("yyyy-MM-dd"),
            EndDate = e.EndDate?.ToString("yyyy-MM-dd"),
            IsCurrent = e.IsCurrent ?? false,
            Description = e.Description
        };

        private static UserEducationDto MapEducation(UserEducation e) => new()
        {
            Id = e.Id,
            SchoolName = e.SchoolName,
            Major = e.Major,
            Degree = e.Degree,
            StartYear = e.StartYear,
            EndYear = e.EndYear,
            Description = e.Description
        };

        private static DateOnly? ParseDate(string? dateStr)
        {
            if (string.IsNullOrWhiteSpace(dateStr)) return null;
            return DateOnly.TryParse(dateStr, out var d) ? d : null;
        }
    }
}