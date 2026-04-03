import api from "./api";

export const testService = {
  // ── Company: Test CRUD ──────────────────────────────
  getMyTests: (params) => api.get("/tests", { params }),
  getTestById: (id) => api.get(`/tests/${id}`),
  createTest: (data) => api.post("/tests", data),
  updateTest: (id, data) => api.put(`/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/tests/${id}`),

  // ── Company: Questions ──────────────────────────────
  getQuestions: (testId) => api.get(`/tests/${testId}/questions`),
  addQuestion: (testId, data) => api.post(`/tests/${testId}/questions`, data),
  updateQuestion: (testId, questionId, data) =>
    api.put(`/tests/${testId}/questions/${questionId}`, data),
  deleteQuestion: (testId, questionId) =>
    api.delete(`/tests/${testId}/questions/${questionId}`),

  // ── Company: Assign test to job ─────────────────────
  getJobTests: (jobId) => api.get(`/tests/jobs/${jobId}`),
  assignTestToJob: (jobId, data) =>
    api.post(`/tests/jobs/${jobId}/assign`, data),
  removeTestFromJob: (jobId, jobTestId) =>
    api.delete(`/tests/jobs/${jobId}/assign/${jobTestId}`),

  // ── Company: Results ────────────────────────────────
  getApplicationTestResults: (applicationId) =>
    api.get(`/tests/applications/${applicationId}/results`),

  // ── Company: Chi tiết bài làm + chấm điểm ──────────
  getApplicationTestDetail: (applicationTestId) =>
    api.get(`/tests/application-tests/${applicationTestId}/detail`),
  scoreManually: (applicationTestId, data) =>
    api.put(`/tests/application-tests/${applicationTestId}/score`, data),

  // ── Company: Interviews ─────────────────────────────
  getInterviews: (params) => api.get("/tests/interviews", { params }),
  getInterviewById: (id) => api.get(`/tests/interviews/${id}`),
  createInterview: (data) => api.post("/tests/interviews", data),
  updateInterview: (id, data) => api.put(`/tests/interviews/${id}`, data),
  submitFeedback: (id, data) =>
    api.put(`/tests/interviews/${id}/feedback`, data),

  // ── User: Làm bài test ──────────────────────────────
  getMyApplicationTests: (applicationId) =>
    api.get(`/tests/applications/${applicationId}`),
  startTest: (applicationTestId) =>
    api.post(`/tests/application-tests/${applicationTestId}/start`),
  submitTest: (applicationTestId, data) =>
    api.post(`/tests/application-tests/${applicationTestId}/submit`, data),

  // ── User: Lịch phỏng vấn ───────────────────────────
  getMyInterviews: () => api.get("/tests/interviews/my"),
};
