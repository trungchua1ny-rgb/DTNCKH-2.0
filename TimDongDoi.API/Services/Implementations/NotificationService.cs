using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Notification;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationListResponse> GetMyNotifications(
        int userId, int page, int pageSize, bool? unreadOnly)
    {
        var query = _context.Notifications
            .Where(n => n.UserId == userId)
            .AsQueryable();

        if (unreadOnly == true)
            query = query.Where(n => n.IsRead != true);

        var totalCount = await query.CountAsync();
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && n.IsRead != true);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type ?? "",
                Title = n.Title ?? "",
                Content = n.Content ?? "",
                Data = n.Data,
                IsRead = n.IsRead ?? false,
                CreatedAt = n.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new NotificationListResponse
        {
            Notifications = notifications,
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<NotificationDto> GetById(int userId, int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId)
            ?? throw new KeyNotFoundException("Notification not found");

        return new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type ?? "",
            Title = notification.Title ?? "",
            Content = notification.Content ?? "",
            Data = notification.Data,
            IsRead = notification.IsRead ?? false,
            CreatedAt = notification.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task MarkAsRead(int userId, int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId)
            ?? throw new KeyNotFoundException("Notification not found");

        notification.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllAsRead(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && n.IsRead != true)
            .ToListAsync();

        foreach (var n in notifications)
            n.IsRead = true;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteNotification(int userId, int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId)
            ?? throw new KeyNotFoundException("Notification not found");

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCount(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && n.IsRead != true);
    }

    public async Task CreateNotification(CreateNotificationRequest request)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Type = request.Type,
            Title = request.Title,
            Content = request.Content,
            Data = request.Data,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }
}