import api from "./api";

export const recommendationService = {
  // User
  getRecommendedJobs: (count = 10) =>
    api.get("/Recommendations/jobs", { params: { count } }),
  getRecommendedProjects: (count = 10) =>
    api.get("/Recommendations/projects", { params: { count } }),
  getStats: () => api.get("/Recommendations/stats"),
  getJobMatch: (jobId) => api.get(`/Recommendations/jobs/${jobId}/match`),
  getProjectMatch: (projectId) =>
    api.get(`/Recommendations/projects/${projectId}/match`),

  // Company
  getCandidatesForJob: (jobId, count = 20) =>
    api.get(`/Recommendations/jobs/${jobId}/candidates`, { params: { count } }),
  getCandidatesForProject: (projectId, count = 20) =>
    api.get(`/Recommendations/projects/${projectId}/candidates`, {
      params: { count },
    }),
};
