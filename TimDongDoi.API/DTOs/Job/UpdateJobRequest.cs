using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Job
{
    /// <summary>
    /// DTO để cập nhật job
    /// </summary>
    public class UpdateJobRequest
    {
        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [MinLength(10, ErrorMessage = "Tiêu đề phải có ít nhất 10 ký tự")]
        [MaxLength(200, ErrorMessage = "Tiêu đề không quá 200 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mô tả công việc là bắt buộc")]
        [MinLength(50, ErrorMessage = "Mô tả phải có ít nhất 50 ký tự")]
        public string Description { get; set; } = string.Empty;

        public string? Requirements { get; set; }

        public string? Benefits { get; set; }

        [Required(ErrorMessage = "Loại hình công việc là bắt buộc")]
        public string Type { get; set; } = "full-time";

        [Required(ErrorMessage = "Cấp bậc là bắt buộc")]
        public string Level { get; set; } = "junior";

        [Range(0, int.MaxValue, ErrorMessage = "Lương tối thiểu không hợp lệ")]
        public int? SalaryMin { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Lương tối đa không hợp lệ")]
        public int? SalaryMax { get; set; }

        public string SalaryCurrency { get; set; } = "VND";

        [Required(ErrorMessage = "Địa điểm làm việc là bắt buộc")]
        public string Location { get; set; } = string.Empty;

        public string LocationType { get; set; } = "onsite";

        [Range(1, 100, ErrorMessage = "Số lượng vị trí phải từ 1-100")]
        public int Positions { get; set; } = 1;

        [Required(ErrorMessage = "Hạn nộp hồ sơ là bắt buộc")]
        public DateTime Deadline { get; set; }
    }
}