using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Message;

public class MessageDto
{
    public int Id { get; set; }
    public int FromUserId { get; set; }
    public string FromUserName { get; set; } = string.Empty;
    public string? FromUserAvatar { get; set; }
    public int ToUserId { get; set; }
    public string ToUserName { get; set; } = string.Empty;
    public string? ToUserAvatar { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? Attachment { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SendMessageRequest
{
    [Required] public int ToUserId { get; set; }
    [Required][MaxLength(2000)] public string Content { get; set; } = string.Empty;
    public string? Attachment { get; set; }
}

public class ConversationDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string LastMessage { get; set; } = string.Empty;
    public DateTime LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}

public class ConversationListResponse
{
    public List<ConversationDto> Conversations { get; set; } = new();
    public int TotalUnread { get; set; }
}

public class MessageListResponse
{
    public List<MessageDto> Messages { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}