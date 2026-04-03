using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Message;
using TimDongDoi.API.DTOs.Notification; // ✅ Thêm namespace này cho CreateNotificationRequest
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations;

public class MessageService : IMessageService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService; // ✅ Thêm Service Thông báo

    // ✅ Tiêm INotificationService vào Constructor
    public MessageService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ConversationListResponse> GetConversations(int userId)
    {
        // Lấy tất cả users đã nhắn tin với userId
        var partnerIds = await _context.Messages
            .Where(m => m.FromUserId == userId || m.ToUserId == userId)
            .Select(m => m.FromUserId == userId ? m.ToUserId : m.FromUserId)
            .Distinct()
            .ToListAsync();

        var conversations = new List<ConversationDto>();

        foreach (var partnerId in partnerIds)
        {
            var partner = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == partnerId);
            if (partner == null) continue;

            var lastMessage = await _context.Messages
                .Where(m =>
                    (m.FromUserId == userId && m.ToUserId == partnerId) ||
                    (m.FromUserId == partnerId && m.ToUserId == userId))
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();

            var unreadCount = await _context.Messages
                .CountAsync(m =>
                    m.FromUserId == partnerId &&
                    m.ToUserId == userId &&
                    m.IsRead != true);

            if (lastMessage != null)
            {
                conversations.Add(new ConversationDto
                {
                    UserId = partnerId,
                    UserName = partner.FullName ?? string.Empty,
                    UserAvatar = partner.Avatar,
                    LastMessage = lastMessage.Message1,
                    LastMessageAt = lastMessage.CreatedAt ?? DateTime.UtcNow,
                    UnreadCount = unreadCount
                });
            }
        }

        var totalUnread = conversations.Sum(c => c.UnreadCount);

        return new ConversationListResponse
        {
            Conversations = conversations.OrderByDescending(c => c.LastMessageAt).ToList(),
            TotalUnread = totalUnread
        };
    }

    public async Task<MessageListResponse> GetMessages(
        int userId, int otherUserId, int page, int pageSize)
    {
        // Kiểm tra user kia có tồn tại không
        var otherUser = await _context.Users.FindAsync(otherUserId)
            ?? throw new KeyNotFoundException("User not found");

        var query = _context.Messages
            .Where(m =>
                (m.FromUserId == userId && m.ToUserId == otherUserId) ||
                (m.FromUserId == otherUserId && m.ToUserId == userId));

        var totalCount = await query.CountAsync();

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(m => m.FromUser)
            .Include(m => m.ToUser)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                FromUserId = m.FromUserId,
                FromUserName = m.FromUser.FullName ?? string.Empty,
                FromUserAvatar = m.FromUser.Avatar,
                ToUserId = m.ToUserId,
                ToUserName = m.ToUser.FullName ?? string.Empty,
                ToUserAvatar = m.ToUser.Avatar,
                Content = m.Message1,
                Attachment = m.Attachment,
                IsRead = m.IsRead ?? false,
                CreatedAt = m.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        // Đảo lại để hiển thị tin nhắn cũ → mới
        messages.Reverse();

        return new MessageListResponse
        {
            Messages = messages,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<MessageDto> SendMessage(int fromUserId, SendMessageRequest request)
    {
        // Không tự nhắn tin cho mình
        if (fromUserId == request.ToUserId)
            throw new InvalidOperationException("Cannot send message to yourself");

        // Kiểm tra người nhận tồn tại
        var toUser = await _context.Users.FindAsync(request.ToUserId)
            ?? throw new KeyNotFoundException("Recipient not found");

        var fromUser = await _context.Users.FindAsync(fromUserId)!;

        var message = new Message
        {
            FromUserId = fromUserId,
            ToUserId = request.ToUserId,
            Message1 = request.Content,
            Attachment = request.Attachment,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // ====== ✅ THÔNG BÁO ======
        // Gửi thông báo cho người nhận (ToUserId) khi có tin nhắn mới
        await _notificationService.CreateNotification(new CreateNotificationRequest
        {
            UserId = request.ToUserId,
            Type = "new_message",
            Title = "Tin nhắn mới! 💬",
            Content = $"{fromUser?.FullName ?? "Ai đó"} vừa gửi cho bạn một tin nhắn.",
            Data = $"{{\"senderId\": {fromUserId}, \"messageId\": {message.Id}}}"
        });

        return new MessageDto
        {
            Id = message.Id,
            FromUserId = fromUserId,
            FromUserName = fromUser?.FullName ?? string.Empty,
            FromUserAvatar = fromUser?.Avatar,
            ToUserId = request.ToUserId,
            ToUserName = toUser.FullName ?? string.Empty,
            ToUserAvatar = toUser.Avatar,
            Content = message.Message1,
            Attachment = message.Attachment,
            IsRead = false,
            CreatedAt = message.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task MarkAsRead(int userId, int otherUserId)
    {
        var messages = await _context.Messages
            .Where(m => m.FromUserId == otherUserId && m.ToUserId == userId && m.IsRead != true)
            .ToListAsync();

        foreach (var m in messages)
            m.IsRead = true;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteMessage(int userId, int messageId)
    {
        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.FromUserId == userId)
            ?? throw new KeyNotFoundException("Message not found or you don't have permission");

        _context.Messages.Remove(message);
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetTotalUnreadCount(int userId)
    {
        return await _context.Messages
            .CountAsync(m => m.ToUserId == userId && m.IsRead != true);
    }
}