using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Application
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int JobId { get; set; }

    public string? CoverLetter { get; set; }

    public string? CvFile { get; set; }

    public string? Status { get; set; }

    public string? RejectReason { get; set; }

    public DateTime? AppliedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ApplicationTest> ApplicationTests { get; set; } = new List<ApplicationTest>();

    public virtual ICollection<Interview> Interviews { get; set; } = new List<Interview>();

    public virtual Job Job { get; set; } = null!;

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual User User { get; set; } = null!;
}
