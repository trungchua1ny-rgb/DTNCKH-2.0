namespace TimDongDoi.API.DTOs.Job
{
    /// <summary>
    /// DTO cơ bản cho Job (dùng cho list, search)
    /// </summary>
    public class JobDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Type { get; set; } // full-time, part-time, contract, internship
        public string? Level { get; set; } // intern, junior, mid, senior, lead
        public int? SalaryMin { get; set; }
        public int? SalaryMax { get; set; }
        public string? SalaryCurrency { get; set; } = "VND";
        public string? Location { get; set; }
        public string? LocationType { get; set; } // onsite, remote, hybrid
        public DateTime? Deadline { get; set; }
        public string Status { get; set; } = "open"; // open, closed, draft
        public int Views { get; set; } = 0;
        public DateTime? CreatedAt { get; set; }

        // Company info
        public CompanyBasicDto? Company { get; set; }

        // Skills required
        public List<JobSkillDto> Skills { get; set; } = new();

        // Stats
        public int TotalApplications { get; set; } = 0;
    }

    /// <summary>
    /// Thông tin cơ bản của công ty
    /// </summary>
    public class CompanyBasicDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Logo { get; set; }
        public string? Industry { get; set; }
        public string? VerificationStatus { get; set; }
    }
}