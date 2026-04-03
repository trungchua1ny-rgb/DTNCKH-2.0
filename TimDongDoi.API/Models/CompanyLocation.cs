using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class CompanyLocation
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? Country { get; set; }

    public bool? IsHeadquarter { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Company Company { get; set; } = null!;
}
