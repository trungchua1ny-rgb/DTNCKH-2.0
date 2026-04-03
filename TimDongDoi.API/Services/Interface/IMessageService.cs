using TimDongDoi.API.DTOs.Message;

namespace TimDongDoi.API.Services.Interfaces;

public interface IMessageService
{
    Task<ConversationListResponse> GetConversations(int userId);
    Task<MessageListResponse> GetMessages(int userId, int otherUserId, int page, int pageSize);
    Task<MessageDto> SendMessage(int fromUserId, SendMessageRequest request);
    Task MarkAsRead(int userId, int otherUserId);
    Task DeleteMessage(int userId, int messageId);
    Task<int> GetTotalUnreadCount(int userId);
}