import api from "./api";

export const projectService = {
  // Public
  getProjects: (params) => api.get("/projects", { params }),

  getFeaturedProjects: (count = 6) =>
    api.get("/projects/featured", { params: { count } }),

  getProjectById: (id) => api.get(`/projects/${id}`),

  getProjectPositions: (projectId) =>
    api.get(`/projects/${projectId}/positions`),

  getProjectMembers: (projectId) => api.get(`/projects/${projectId}/members`),

  // User - Apply
  applyToProject: (projectId, data) =>
    api.post(`/projects/${projectId}/apply`, data),

  getMyApplications: (params) =>
    api.get("/projects/applications/my", { params }),

  withdrawApplication: (id) => api.delete(`/projects/applications/${id}`),

  leaveProject: (projectId) => api.post(`/projects/${projectId}/leave`),

  // Owner - CRUD
  getMyProjects: (params) => api.get("/projects/my", { params }),

  createProject: (data) => api.post("/projects", data),

  updateProject: (id, data) => api.put(`/projects/${id}`, data),

  deleteProject: (id) => api.delete(`/projects/${id}`),

  closeProject: (id) => api.put(`/projects/${id}/close`),

  reopenProject: (id) => api.put(`/projects/${id}/reopen`),

  markInProgress: (id) => api.put(`/projects/${id}/in-progress`),

  markCompleted: (id) => api.put(`/projects/${id}/completed`),

  // Owner - Positions
  addPosition: (projectId, data) =>
    api.post(`/projects/${projectId}/positions`, data),

  updatePosition: (positionId, data) =>
    api.put(`/projects/positions/${positionId}`, data),

  deletePosition: (positionId) =>
    api.delete(`/projects/positions/${positionId}`),

  // Owner - Applications
  getProjectApplications: (projectId, params) =>
    api.get(`/projects/${projectId}/applications`, { params }),

  acceptApplication: (id) => api.put(`/projects/applications/${id}/accept`),

  rejectApplication: (id) => api.put(`/projects/applications/${id}/reject`),

  // Owner - Members
  removeMember: (memberId) => api.delete(`/projects/members/${memberId}`),
};
