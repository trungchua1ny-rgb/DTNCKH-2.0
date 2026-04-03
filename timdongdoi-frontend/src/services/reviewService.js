import api from "./api";

const reviewService = {
  // GET /api/reviews/users/{userId} — danh sách reviews nhận được (public)
  getUserReviews: (userId, params) =>
    api.get(`/reviews/users/${userId}`, { params }),

  // GET /api/reviews/users/{userId}/stats — thống kê rating
  getUserReviewStats: (userId) => api.get(`/reviews/users/${userId}/stats`),

  // GET /api/reviews/users/{userId}/summary — summary hiển thị trên profile
  getUserReviewSummary: (userId) => api.get(`/reviews/users/${userId}/summary`),

  // GET /api/reviews/my-reviews — reviews mình đã viết
  getMyReviews: (params) => api.get("/reviews/my-reviews", { params }),

  // GET /api/reviews/can-review/jobs/{applicationId}/users/{toUserId}
  canReviewJob: (applicationId, toUserId) =>
    api.get(`/reviews/can-review/jobs/${applicationId}/users/${toUserId}`),

  // GET /api/reviews/can-review/projects/{projectMemberId}/users/{toUserId}
  canReviewProject: (projectMemberId, toUserId) =>
    api.get(
      `/reviews/can-review/projects/${projectMemberId}/users/${toUserId}`,
    ),

  // POST /api/reviews/jobs — tạo review job
  // body: { applicationId, toUserId, rating, comment }
  createJobReview: (data) => api.post("/reviews/jobs", data),

  // POST /api/reviews/projects — tạo review project
  // body: { projectMemberId, toUserId, rating, comment }
  createProjectReview: (data) => api.post("/reviews/projects", data),

  // PUT /api/reviews/{id} — sửa review (trong 7 ngày)
  // body: { rating?, comment? }
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),

  // DELETE /api/reviews/{id}
  deleteReview: (id) => api.delete(`/reviews/${id}`),

  // PUT /api/reviews/{id}/toggle-visibility
  toggleVisibility: (id) => api.put(`/reviews/${id}/toggle-visibility`),
};

export default reviewService;
