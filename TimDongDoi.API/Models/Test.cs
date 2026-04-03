using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Test
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int? DurationMinutes { get; set; }

    public int? PassingScore { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ApplicationTest> ApplicationTests { get; set; } = new List<ApplicationTest>();

    public virtual Company Company { get; set; } = null!;

    public virtual ICollection<JobTest> JobTests { get; set; } = new List<JobTest>();

    public virtual ICollection<TestQuestion> TestQuestions { get; set; } = new List<TestQuestion>();
}
