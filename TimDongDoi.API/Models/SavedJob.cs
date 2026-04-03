using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class SavedJob
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int JobId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Job Job { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
