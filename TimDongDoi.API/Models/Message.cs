using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Message
{
    public int Id { get; set; }

    public int FromUserId { get; set; }

    public int ToUserId { get; set; }

    public string Message1 { get; set; } = null!;

    public string? Attachment { get; set; }

    public bool? IsRead { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User FromUser { get; set; } = null!;

    public virtual User ToUser { get; set; } = null!;
}
