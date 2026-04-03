using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Company
{
    /// <summary>
    /// DTO cho địa điểm công ty
    /// </summary>
    public class CompanyLocationDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? City { get; set; }
        public string? Country { get; set; }
        public bool IsHeadquarter { get; set; } = false;
        public DateTime? CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO để thêm địa điểm mới
    /// </summary>
    public class AddLocationRequest
    {
        [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
        [MaxLength(255)]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thành phố là bắt buộc")]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Country { get; set; } = "Vietnam";

        public bool IsHeadquarter { get; set; } = false;
    }

    /// <summary>
    /// DTO để cập nhật địa điểm
    /// </summary>
    public class UpdateLocationRequest
    {
        [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
        [MaxLength(255)]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thành phố là bắt buộc")]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Country { get; set; }

        public bool IsHeadquarter { get; set; } = false;
    }
}