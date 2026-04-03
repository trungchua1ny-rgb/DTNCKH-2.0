using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Job
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? Requirements { get; set; }

    public string? Benefits { get; set; }

    public string? Type { get; set; }

    public string? Level { get; set; }

    public int? SalaryMin { get; set; }

    public int? SalaryMax { get; set; }

    public string? SalaryCurrency { get; set; }

    public string? Location { get; set; }

    public string? LocationType { get; set; }

    public int? Positions { get; set; }

    public DateOnly? Deadline { get; set; }

    public string? Status { get; set; }

    public int? Views { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();

    public virtual Company Company { get; set; } = null!;

    public virtual ICollection<JobSkill> JobSkills { get; set; } = new List<JobSkill>();

    public virtual ICollection<JobTest> JobTests { get; set; } = new List<JobTest>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual ICollection<SavedJob> SavedJobs { get; set; } = new List<SavedJob>();
}
