using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Interview
{
    public int Id { get; set; }

    public int ApplicationId { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public DateTime ScheduledAt { get; set; }

    public int? DurationMinutes { get; set; }

    public string? MeetingLink { get; set; }

    public string? Status { get; set; }

    public string? Feedback { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Application Application { get; set; } = null!;
}
