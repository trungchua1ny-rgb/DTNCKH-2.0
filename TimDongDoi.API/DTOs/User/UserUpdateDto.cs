using System;
using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.User
{
    public class UserUpdateDto
    {
        [Required(ErrorMessage = "Họ và tên là bắt buộc.")]
        [MaxLength(100, ErrorMessage = "Họ và tên không được quá 100 ký tự.")]
        public string FullName { get; set; } = string.Empty;
        
       [RegularExpression(@"^(0|\+84)[0-9]{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ.")]
        [MaxLength(20, ErrorMessage = "Số điện thoại không được quá 20 ký tự.")]
        public string? Phone { get; set; }
        
        public string? AboutMe { get; set; }
        
        [MaxLength(500, ErrorMessage = "Địa chỉ không được quá 500 ký tự.")]
        public string? Address { get; set; }
        
        public DateTime? Birthday { get; set; }
        
        [MaxLength(10)]
        [RegularExpression("^(male|female|other)$", 
            ErrorMessage = "Giới tính phải là 'male', 'female' hoặc 'other'.")]
        public string? Gender { get; set; }
        
        [MaxLength(255, ErrorMessage = "Vị trí công việc không được quá 255 ký tự.")]
        public string? JobTitle { get; set; } 
        
        [Range(0, int.MaxValue, ErrorMessage = "Mức lương mong muốn phải là số dương.")]
        public int? SalaryExpectation { get; set; }
    }
    public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
}