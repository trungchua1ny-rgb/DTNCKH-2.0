import api from "./api";

const adminService = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  // GET /api/admin/dashboard
  // Response: { success, data: DashboardStatsDto }
  // DashboardStatsDto: { overall, monthlyStats, applicationStats, topCompanies, topJobs }
  getDashboard: () => api.get("/admin/dashboard"),

  // GET /api/admin/dashboard/monthly?months=6
  // Response: { success, data: MonthlyStatDto[] }
  getMonthlyStats: (months = 6) =>
    api.get("/admin/dashboard/monthly", { params: { months } }),

  // ── Users ─────────────────────────────────────────────────────────────────
  // GET /api/admin/users?search=&role=&status=&page=1&pageSize=20
  // Response: { success, data: { users, totalCount, page, pageSize } }
  getUsers: (params) => api.get("/admin/users", { params }),

  // GET /api/admin/users/{id}
  getUserById: (id) => api.get(`/admin/users/${id}`),

  // ── Companies ─────────────────────────────────────────────────────────────
  // GET /api/admin/companies?search=&verificationStatus=&page=&pageSize=
  // Response: { success, data: { companies, totalCount, page, pageSize } }
  getCompanies: (params) => api.get("/admin/companies", { params }),

  // ── Jobs ──────────────────────────────────────────────────────────────────
  // GET /api/admin/jobs?search=&status=&page=&pageSize=
  // Response: { success, data: { jobs, totalCount, page, pageSize } }
  getJobs: (params) => api.get("/admin/jobs", { params }),

  // DELETE /api/admin/jobs/{id}
  // Body: { reason: string }
  deleteJob: (id, reason) =>
    api.delete(`/admin/jobs/${id}`, { data: { reason } }),

  // ── Projects ──────────────────────────────────────────────────────────────
  // GET /api/admin/projects?search=&status=&page=&pageSize=
  // Response: { success, data: { projects, totalCount, page, pageSize } }
  getProjects: (params) => api.get("/admin/projects", { params }),

  // DELETE /api/admin/projects/{id}
  deleteProject: (id, reason) =>
    api.delete(`/admin/projects/${id}`, { data: { reason } }),

  // ── Logs ──────────────────────────────────────────────────────────────────
  // GET /api/admin/logs?page=&pageSize=&action=
  // Response: { success, data: { logs, totalCount, page, pageSize } }
  getLogs: (params) => api.get("/admin/logs", { params }),

  // ── Export ────────────────────────────────────────────────────────────────
  exportUsers: () => api.get("/admin/export/users", { responseType: "blob" }),

  exportJobs: () => api.get("/admin/export/jobs", { responseType: "blob" }),

  // ── Reports ───────────────────────────────────────────────────────────────
  // GET /api/reports?page=&pageSize=&status=&type=
  // Response: { success, data: { reports, totalCount, page, pageSize } }
  getAllReports: (params) => api.get("/reports", { params }),

  // GET /api/reports/{id}
  getReportById: (id) => api.get(`/reports/${id}`),

  // PUT /api/reports/{id}/handle
  // Body: { status, adminNote, banAction? }
  handleReport: (id, data) => api.put(`/reports/${id}/handle`, data),

  // PUT /api/reports/users/{userId}/unban
  unbanUser: (userId) => api.put(`/reports/users/${userId}/unban`),

  // GET /api/reports/users/{userId}/status
  getUserStatus: (userId) => api.get(`/reports/users/${userId}/status`),

  // POST /api/reports  (tạo report để ban - dùng nội bộ admin flow)
  createReport: (data) => api.post("/reports", data),

  // ── Company Verifications ─────────────────────────────────────────────────
  // GET /api/companies/me/verifications (lấy pending verifications)
  // Dùng endpoint admin nếu có, hoặc dùng report flow
  getPendingVerifications: (params) =>
    api.get("/admin/companies/verifications", { params }),


  processVerification: (id, data) =>
    api.put(`/admin/companies/verifications/${id}`, data),
};

export default adminService;
