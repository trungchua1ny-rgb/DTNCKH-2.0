using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class AdminLog
{
    public int Id { get; set; }

    public int AdminId { get; set; }

    public string? Action { get; set; }

    public string? TargetType { get; set; }

    public int TargetId { get; set; }

    public string? Reason { get; set; }

    public string? Metadata { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User Admin { get; set; } = null!;
}
