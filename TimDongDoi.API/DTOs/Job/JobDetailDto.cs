namespace TimDongDoi.API.DTOs.Job
{
    /// <summary>
    /// DTO chi tiết cho Job (bao gồm description, requirements, benefits)
    /// </summary>
    public class JobDetailDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Requirements { get; set; }
        public string? Benefits { get; set; }
        public string? Type { get; set; }
        public string? Level { get; set; }
        public int? SalaryMin { get; set; }
        public int? SalaryMax { get; set; }
        public string? SalaryCurrency { get; set; } = "VND";
        public string? Location { get; set; }
        public string? LocationType { get; set; }
        public int Positions { get; set; } = 1;
        public DateTime? Deadline { get; set; }
        public string Status { get; set; } = "open";
        public int Views { get; set; } = 0;
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Company info
        public CompanyBasicDto? Company { get; set; }

        // Skills required
        public List<JobSkillDto> Skills { get; set; } = new();

        // Stats
        public JobStatsDto? Stats { get; set; }

        // User-specific data (nếu user đã login)
        public bool? IsSaved { get; set; }
        public bool? HasApplied { get; set; }
    }

    /// <summary>
    /// Thống kê của job
    /// </summary>
    public class JobStatsDto
    {
        public int TotalApplications { get; set; } = 0;
        public int PendingApplications { get; set; } = 0;
        public int AcceptedApplications { get; set; } = 0;
        public int Views { get; set; } = 0;
        public int DaysRemaining { get; set; } = 0;
    }
}