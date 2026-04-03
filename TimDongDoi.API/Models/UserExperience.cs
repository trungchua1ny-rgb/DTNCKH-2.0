using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class UserExperience
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? CompanyName { get; set; }

    public string? Position { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public bool? IsCurrent { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
