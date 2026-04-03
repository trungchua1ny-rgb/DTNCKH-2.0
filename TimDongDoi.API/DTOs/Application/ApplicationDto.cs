namespace TimDongDoi.API.DTOs.Application
{
    /// <summary>
    /// DTO cơ bản cho Application
    /// </summary>
    public class ApplicationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int JobId { get; set; }
        public string? CoverLetter { get; set; }
        public string? CvFile { get; set; }
        public string Status { get; set; } = "pending"; // pending, reviewing, interview, accepted, rejected
        public string? RejectReason { get; set; }
        public DateTime? AppliedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Job info (cho User xem đơn của mình)
        public JobBasicDto? Job { get; set; }

        // User info (cho Company xem ứng viên)
        public UserBasicDto? User { get; set; }
    }

    /// <summary>
    /// Thông tin cơ bản của job
    /// </summary>
    public class JobBasicDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? Type { get; set; }
        public string? Level { get; set; }
        public int? SalaryMin { get; set; }
        public int? SalaryMax { get; set; }
        public string Status { get; set; } = "open";
        public CompanyBasicInfo? Company { get; set; }
    }

    /// <summary>
    /// Thông tin cơ bản của user (cho Company xem)
    /// </summary>
    public class UserBasicDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
        public string? JobTitle { get; set; }
        public int? SalaryExpectation { get; set; }
    }

    /// <summary>
    /// Thông tin công ty (dùng trong JobBasicDto)
    /// </summary>
    public class CompanyBasicInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Logo { get; set; }
    }
}