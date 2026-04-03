using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? Type { get; set; }

    public string? Title { get; set; }

    public string? Content { get; set; }

    public string? Data { get; set; }

    public bool? IsRead { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
