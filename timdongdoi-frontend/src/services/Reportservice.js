import api from "./api";

export const reportService = {
  createReport: (data) => api.post("/reports", data),
  getMyReports: (params) => api.get("/reports/my", { params }),
  getAllReports: (params) => api.get("/reports", { params }),
  getReportById: (id) => api.get(`/reports/${id}`),
  handleReport: (id, data) => api.put(`/reports/${id}/handle`, data),
  unbanUser: (userId) => api.put(`/reports/users/${userId}/unban`),
  getUserStatus: (userId) => api.get(`/reports/users/${userId}/status`),
};
