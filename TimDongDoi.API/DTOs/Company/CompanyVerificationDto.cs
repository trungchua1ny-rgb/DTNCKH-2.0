using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Company
{
    /// <summary>
    /// DTO response cho verification
    /// </summary>
    public class CompanyVerificationDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public int? VerifiedBy { get; set; }
        public string? VerifiedByName { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string? DocumentUrl { get; set; }
        public string Status { get; set; } = "pending"; // pending, verified, rejected
        public string? Notes { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }

    /// <summary>
    /// DTO để gửi yêu cầu xác minh công ty
    /// </summary>
    public class SubmitVerificationRequest
    {
        [Required(ErrorMessage = "Loại giấy tờ là bắt buộc")]
        public string DocumentType { get; set; } = string.Empty; // "business_license", "tax_code", "registration_certificate"

        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO để Admin duyệt/từ chối verification
    /// </summary>
    public class ProcessVerificationRequest
    {
        [Required]
        public string Action { get; set; } = string.Empty; // "approve" hoặc "reject"

        public string? Notes { get; set; }
    }

    /// <summary>
    /// Response sau khi upload file
    /// </summary>
    public class UploadFileResponse
    {
        public bool Success { get; set; } = true;
        public string Url { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}