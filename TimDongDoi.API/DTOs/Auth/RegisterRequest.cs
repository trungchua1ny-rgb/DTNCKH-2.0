using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Auth
{
    /// <summary>
    /// DTO cho đăng ký tài khoản User (người tìm việc)
    /// </summary>
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        public string FullName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? Phone { get; set; }

        // Optional: Thông tin bổ sung khi đăng ký
        public string? JobTitle { get; set; }
        public DateTime? Birthday { get; set; }
    }
}