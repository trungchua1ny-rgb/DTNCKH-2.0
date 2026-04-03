using System;
using System.Collections.Generic;

namespace TimDongDoi.API.Models;

public partial class Review
{
    public int Id { get; set; }
    public int FromUserId { get; set; }
    public int ToUserId { get; set; }
    public int? ApplicationId { get; set; }
    public int? ProjectMemberId { get; set; }
    public string? Type { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool? IsVisible { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual Application? Application { get; set; }
    public virtual ProjectMember? ProjectMember { get; set; }
    
    // Đã xóa [NotMapped] ở đây
    public virtual User FromUser { get; set; } = null!;
    public virtual User ToUser { get; set; } = null!;
    
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}