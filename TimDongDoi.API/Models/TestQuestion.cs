using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class TestQuestion
{
    public int Id { get; set; }

    public int TestId { get; set; }

    public string Question { get; set; } = null!;

    public string? Type { get; set; }

    public string? Options { get; set; }

    public string? CorrectAnswer { get; set; }

    public int? Points { get; set; }

    public int? OrderNum { get; set; }

    public virtual Test Test { get; set; } = null!;
}
