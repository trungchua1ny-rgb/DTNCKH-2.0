using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Notification;
public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Data { get; set; }
}

public class CreateNotificationRequest
{
    [Required] public int UserId { get; set; }
    [Required] public string Type { get; set; } = string.Empty; // application, interview, message, review, project
    [Required] public string Title { get; set; } = string.Empty;
    [Required] public string Content { get; set; } = string.Empty;
    public string? Link { get; set; }
    public string? Data { get; set; }
}

public class NotificationListResponse
{
    public List<NotificationDto> Notifications { get; set; } = new();
    public int TotalCount { get; set; }
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}