import api from "./api";

const notificationService = {
  // GET /api/notifications?page=&pageSize=&unreadOnly=
  getNotifications: (params) => api.get("/notifications", { params }),

  // GET /api/notifications/unread-count
  getUnreadCount: () => api.get("/notifications/unread-count"),

  // PUT /api/notifications/{id}/read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  // PUT /api/notifications/read-all
  markAllAsRead: () => api.put("/notifications/read-all"),

  // DELETE /api/notifications/{id}
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default notificationService;
