import api from "./api";

const messageService = {
  // GET /api/messages/conversations
  getConversations: () => api.get("/messages/conversations"),

  // GET /api/messages/conversations/{otherUserId}?page=&pageSize=
  getMessages: (otherUserId, params) =>
    api.get(`/messages/conversations/${otherUserId}`, { params }),

  // POST /api/messages — { toUserId, content, attachment? }
  sendMessage: (data) => api.post("/messages", data),

  // PUT /api/messages/conversations/{otherUserId}/read
  markAsRead: (otherUserId) =>
    api.put(`/messages/conversations/${otherUserId}/read`),

  // DELETE /api/messages/{messageId}
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),

  // GET /api/messages/unread-count
  getUnreadCount: () => api.get("/messages/unread-count"),
};

export default messageService;
