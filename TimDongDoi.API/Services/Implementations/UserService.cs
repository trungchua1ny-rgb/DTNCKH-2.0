using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.User;
using TimDongDoi.API.DTOs.Notification;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;
using System.Security.Claims;

namespace TimDongDoi.API.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly INotificationService _notificationService;

        public UserService(AppDbContext context, IHttpContextAccessor httpContextAccessor, INotificationService notificationService)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _notificationService = notificationService;
        }

        private UserProfileDto MapToUserProfileDto(User user)
        {
            if (user == null) throw new ArgumentNullException(nameof(user));

            return new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName ?? string.Empty,
                Role = user.Role ?? "user",
                Phone = user.Phone,
                Avatar = user.Avatar,
                AboutMe = user.AboutMe,
                Address = user.Address,
                Birthday = user.Birthday,
                Gender = user.Gender,
                JobTitle = user.JobTitle,
                SalaryExpectation = user.SalaryExpectation,
                CvFile = user.CvFile,
                CreatedAt = user.CreatedAt,
                Skills = new List<UserSkillDto>(),
                Experiences = new List<UserExperienceDto>(),
                Educations = new List<UserEducationDto>()
            };
        }

        public int GetUserIdFromClaims()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("JWT Token không hợp lệ hoặc thiếu User ID trong Claims.");
            return userId;
        }

        public async Task<UserProfileDto> GetUserProfile(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            return MapToUserProfileDto(user);
        }

        public async Task<UserProfileDto> UpdateUserProfile(int userId, UserUpdateDto updateDto)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            user.FullName = updateDto.FullName;
            user.Phone = updateDto.Phone;
            user.AboutMe = updateDto.AboutMe;
            user.Address = updateDto.Address;
            user.JobTitle = updateDto.JobTitle;
            user.SalaryExpectation = updateDto.SalaryExpectation;
            user.Birthday = updateDto.Birthday;

            if (!string.IsNullOrWhiteSpace(updateDto.Gender))
            {
                var normalizedGender = updateDto.Gender.ToLower().Trim();
                if (normalizedGender == "male" || normalizedGender == "female" || normalizedGender == "other")
                    user.Gender = normalizedGender;
                else
                    throw new ArgumentException("Giới tính phải là 'male', 'female' hoặc 'other'");
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Thông báo cập nhật hồ sơ thành công
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "system",
                Title = "Hồ sơ đã được cập nhật ✅",
                Content = "Thông tin cá nhân của bạn đã được cập nhật thành công.",
                Data = $"{{\"userId\": {userId}}}"
            });

            return await GetUserProfile(userId);
        }

        // ============================================
        // ĐỔI MẬT KHẨU
        // ============================================

        public async Task ChangePassword(int userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

            // Convert byte[] sang string như AuthService đang làm
            var storedHash = System.Text.Encoding.UTF8.GetString(user.PasswordHash);

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, storedHash))
                throw new InvalidOperationException("Mật khẩu hiện tại không đúng.");

            if (dto.NewPassword != dto.ConfirmPassword)
                throw new InvalidOperationException("Mật khẩu mới và xác nhận mật khẩu không khớp.");

            if (BCrypt.Net.BCrypt.Verify(dto.NewPassword, storedHash))
                throw new InvalidOperationException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");

            if (dto.NewPassword.Length < 6)
                throw new InvalidOperationException("Mật khẩu mới phải có ít nhất 6 ký tự.");

            user.PasswordHash = System.Text.Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(dto.NewPassword));
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "system",
                Title = "Mật khẩu đã được thay đổi 🔒",
                Content = "Mật khẩu tài khoản của bạn vừa được thay đổi thành công. Nếu không phải bạn thực hiện, hãy liên hệ hỗ trợ ngay.",
                Data = $"{{\"userId\": {userId}}}"
            });
        }
    }
}