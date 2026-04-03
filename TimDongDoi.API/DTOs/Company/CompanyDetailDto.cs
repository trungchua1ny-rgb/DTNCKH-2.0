namespace TimDongDoi.API.DTOs.Company
{
    /// <summary>
    /// DTO chi tiết cho Company (bao gồm locations, stats)
    /// </summary>
    public class CompanyDetailDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Logo { get; set; }
        public string? Description { get; set; }
        public string? Website { get; set; }
        public string? Industry { get; set; }
        public string? Size { get; set; }
        public int? FoundedYear { get; set; }
        public string VerificationStatus { get; set; } = "pending";
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Thông tin user đại diện
        public UserBasicDto? Representative { get; set; }

        // Danh sách địa điểm
        public List<CompanyLocationDto> Locations { get; set; } = new();

        // Thống kê
        public CompanyStatsDto? Stats { get; set; }
    }

    /// <summary>
    /// Thông tin cơ bản của user đại diện
    /// </summary>
    public class UserBasicDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    /// <summary>
    /// Thống kê của công ty
    /// </summary>
    public class CompanyStatsDto
    {
        public int TotalJobs { get; set; } = 0;
        public int ActiveJobs { get; set; } = 0;
        public int TotalApplications { get; set; } = 0;
        public int TotalLocations { get; set; } = 0;
    }
}