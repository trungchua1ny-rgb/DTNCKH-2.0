namespace TimDongDoi.API.DTOs.Company
{
    /// <summary>
    /// DTO cơ bản cho Company (dùng cho list, search)
    /// </summary>
    public class CompanyDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Logo { get; set; }
        public string? Industry { get; set; }
        public string? Size { get; set; }
        public string? Website { get; set; }
        public string VerificationStatus { get; set; } = "pending";
        public DateTime? CreatedAt { get; set; }

        // Thông tin tóm tắt
        public int TotalJobs { get; set; } = 0;
        public int TotalLocations { get; set; } = 0;
    }
}