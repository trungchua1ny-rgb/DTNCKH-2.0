using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Auth
{
    /// <summary>
    /// DTO cho đăng ký tài khoản Admin (chỉ Admin hiện tại mới tạo được)
    /// </summary>
    public class RegisterAdminRequest
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(8, ErrorMessage = "Mật khẩu Admin phải có ít nhất 8 ký tự")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        public string FullName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? Phone { get; set; }
    }
}