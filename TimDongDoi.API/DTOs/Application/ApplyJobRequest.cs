using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Application
{
    /// <summary>
    /// DTO để user apply job
    /// </summary>
    public class ApplyJobRequest
    {
        [Required(ErrorMessage = "Cover letter là bắt buộc")]
        [MinLength(50, ErrorMessage = "Cover letter phải có ít nhất 50 ký tự")]
        public string CoverLetter { get; set; } = string.Empty;

        // CV file sẽ upload qua IFormFile trong controller
    }

    /// <summary>
    /// DTO để company update status application
    /// </summary>
    public class UpdateApplicationStatusRequest
    {
        [Required(ErrorMessage = "Status là bắt buộc")]
        public string Status { get; set; } = string.Empty; // reviewing, interview, accepted, rejected

        public string? RejectReason { get; set; } // Bắt buộc nếu status = rejected
    }
}