using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class ApplicationTest
{
    public int Id { get; set; }

    public int ApplicationId { get; set; }

    public int TestId { get; set; }

    public string? Answers { get; set; }

    public int? Score { get; set; }

    public string? Status { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual Application Application { get; set; } = null!;

    public virtual Test Test { get; set; } = null!;
    public string? ManualScores { get; set; }
}
