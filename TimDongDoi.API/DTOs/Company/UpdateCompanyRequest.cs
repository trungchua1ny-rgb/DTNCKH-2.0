using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Company
{
    /// <summary>
    /// DTO để cập nhật thông tin công ty
    /// </summary>
    public class UpdateCompanyRequest
    {
        [Required(ErrorMessage = "Tên công ty là bắt buộc")]
        [MinLength(3, ErrorMessage = "Tên công ty phải có ít nhất 3 ký tự")]
        [MaxLength(200, ErrorMessage = "Tên công ty không quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Mô tả không được quá 1000 ký tự")]
        public string? Description { get; set; }

        [Url(ErrorMessage = "Website không hợp lệ")]
        [MaxLength(255)]
        public string? Website { get; set; }

        [Required(ErrorMessage = "Ngành nghề là bắt buộc")]
        [MaxLength(100)]
        public string Industry { get; set; } = string.Empty;

        /// <summary>
        /// Quy mô: "1-10", "11-50", "51-200", "201-500", "500+"
        /// </summary>
        [MaxLength(50)]
        public string? Size { get; set; }

        [Range(1900, 2100, ErrorMessage = "Năm thành lập không hợp lệ")]
        public int? FoundedYear { get; set; }
    }
}