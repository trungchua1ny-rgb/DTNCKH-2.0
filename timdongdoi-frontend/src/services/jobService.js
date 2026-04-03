
import api from "./api";

export const jobService = {
  // ==========================================
  // PUBLIC - TÌM KIẾM & XEM
  // ==========================================

  // Tìm kiếm việc làm (dùng cho JobSearchPage)
  searchJobs: (params) => api.get("/jobs", { params }),

  // Lấy jobs nổi bật
  getFeaturedJobs: (limit = 10) =>
    api.get("/jobs/featured", { params: { limit } }),

  // Lấy jobs theo công ty
  getJobsByCompany: (companyId, params) =>
    api.get(`/jobs/company/${companyId}`, { params }),

  // Xem chi tiết job
  getJobById: (id) => api.get(`/jobs/${id}`),

  // Alias cũ (giữ để không break các trang khác)
  getJobs: (params) => api.get("/jobs", { params }),

  // ==========================================
  // USER - ỨNG TUYỂN
  // ==========================================

  applyJob: (jobId, formData) =>
    api.post(`/applications/jobs/${jobId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMyApplications: (params) => api.get("/applications/my", { params }),

  getApplicationById: (id) => api.get(`/applications/${id}`),

  withdrawApplication: (applicationId) =>
    api.delete(`/applications/${applicationId}`),

  // ==========================================
  // USER - LƯU JOB
  // ==========================================

  saveJob: (jobId) => api.post(`/jobs/${jobId}/save`),

  unsaveJob: (jobId) => api.delete(`/jobs/${jobId}/save`),

  getSavedJobs: (params) => api.get("/jobs/saved", { params }),

  // ==========================================
  // COMPANY - QUẢN LÝ TIN
  // ==========================================

  getMyJobs: (params) => api.get("/jobs/my", { params }),

  getCompanyJobs: (params) => api.get("/jobs/my", { params }),

  createJob: (data) => api.post("/jobs", data),

  updateJob: (id, data) => api.put(`/jobs/${id}`, data),

  deleteJob: (id) => api.delete(`/jobs/${id}`),

  cloneJob: (id) => api.post(`/jobs/${id}/clone`),

  publishJob: (id) => api.put(`/jobs/${id}/publish`),

  closeJob: (id) => api.put(`/jobs/${id}/close`),

  reopenJob: (id) => api.put(`/jobs/${id}/reopen`),

  getJobStats: (id) => api.get(`/jobs/${id}/stats`),

  // ==========================================
  // COMPANY - ỨNG VIÊN
  // ==========================================

  getJobApplications: (jobId, params) =>
    api.get(`/applications/jobs/${jobId}`, { params }),

  updateApplicationStatus: (applicationId, data) =>
    api.put(`/applications/${applicationId}/status`, data),

  // ==========================================
  // SKILLS
  // ==========================================

  getJobSkills: (id) => api.get(`/jobs/${id}/skills`),

  addJobSkill: (id, data) => api.post(`/jobs/${id}/skills`, data),

  removeJobSkill: (id, skillId) => api.delete(`/jobs/${id}/skills/${skillId}`),
};
