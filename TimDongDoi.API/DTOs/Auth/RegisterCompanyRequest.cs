using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Auth
{
    /// <summary>
    /// DTO cho đăng ký tài khoản Company
    /// </summary>
    public class RegisterCompanyRequest
    {
        // ===== THÔNG TIN TÀI KHOẢN =====
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Họ tên người đại diện là bắt buộc")]
        public string FullName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? Phone { get; set; }

        // ===== THÔNG TIN CÔNG TY =====
        [Required(ErrorMessage = "Tên công ty là bắt buộc")]
        [MinLength(3, ErrorMessage = "Tên công ty phải có ít nhất 3 ký tự")]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Mô tả không được quá 1000 ký tự")]
        public string? Description { get; set; }

        [Url(ErrorMessage = "Website không hợp lệ")]
        public string? Website { get; set; }

        [Required(ErrorMessage = "Ngành nghề là bắt buộc")]
        public string Industry { get; set; } = string.Empty;

        /// <summary>
        /// Quy mô công ty: "1-10", "11-50", "51-200", "201-500", "500+"
        /// </summary>
        public string? Size { get; set; }

        [Range(1900, 2100, ErrorMessage = "Năm thành lập không hợp lệ")]
        public int? FoundedYear { get; set; }
    }
}