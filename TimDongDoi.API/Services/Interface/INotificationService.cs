using TimDongDoi.API.DTOs.Notification;

namespace TimDongDoi.API.Services.Interfaces;

public interface INotificationService
{
    Task<NotificationListResponse> GetMyNotifications(int userId, int page, int pageSize, bool? unreadOnly);
    Task<NotificationDto> GetById(int userId, int notificationId);
    Task MarkAsRead(int userId, int notificationId);
    Task MarkAllAsRead(int userId);
    Task DeleteNotification(int userId, int notificationId);
    Task<int> GetUnreadCount(int userId);
    
    // Internal - dùng bởi các service khác
    Task CreateNotification(CreateNotificationRequest request);
}