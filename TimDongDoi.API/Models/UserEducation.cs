using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class UserEducation
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? SchoolName { get; set; }

    public string? Major { get; set; }

    public string? Degree { get; set; }

    public int? StartYear { get; set; }

    public int? EndYear { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
