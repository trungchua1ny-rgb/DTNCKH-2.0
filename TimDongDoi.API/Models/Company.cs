using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Company
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string? Logo { get; set; }

    public string? Description { get; set; }

    public string? Website { get; set; }

    public string? Industry { get; set; }

    public string? Size { get; set; }

    public int? FoundedYear { get; set; }

    public string? VerificationStatus { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<CompanyLocation> CompanyLocations { get; set; } = new List<CompanyLocation>();

    public virtual ICollection<CompanyVerification> CompanyVerifications { get; set; } = new List<CompanyVerification>();

    public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();

    public virtual ICollection<Test> Tests { get; set; } = new List<Test>();

    public virtual User User { get; set; } = null!;
}
