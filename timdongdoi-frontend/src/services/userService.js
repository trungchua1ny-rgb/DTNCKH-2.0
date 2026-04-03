import api from "./api";

const userService = {
  // ==================== PROFILE ====================
  // GET /api/Users/{id} - Xem profile công khai của user bất kỳ
  getPublicProfile: (id) => api.get(`/Users/${id}`),

  // GET /api/Users/profile/me
  // Response: { Message, Data: UserProfileDto }
  getMyProfile: () => api.get("/Users/profile/me"),

  // PUT /api/Users/profile/me
  // Body: { fullName, phone, aboutMe, address, jobTitle, salaryExpectation, birthday, gender }
  updateProfile: (data) => api.put("/Users/profile/me", data),

  // ==================== AVATAR & CV ====================
  // POST /api/users/me/avatar (multipart)
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // POST /api/users/me/cv (multipart)
  uploadCv: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/users/me/cv", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ==================== SKILLS ====================
  // GET /api/users/me/skills
  getMySkills: () => api.get("/users/me/skills"),

  // POST /api/users/me/skills
  // Body: { skillId, level, yearsExperience, description }
  addSkill: (data) => api.post("/users/me/skills", data),

  // PUT /api/users/me/skills/{id}
  updateSkill: (id, data) => api.put(`/users/me/skills/${id}`, data),

  // DELETE /api/users/me/skills/{id}
  deleteSkill: (id) => api.delete(`/users/me/skills/${id}`),

  // ==================== EXPERIENCES ====================
  // GET /api/users/me/experiences
  getExperiences: () => api.get("/users/me/experiences"),

  // POST /api/users/me/experiences
  // Body: { companyName, position, startDate, endDate, isCurrent, description }
  addExperience: (data) => api.post("/users/me/experiences", data),

  // PUT /api/users/me/experiences/{id}
  updateExperience: (id, data) => api.put(`/users/me/experiences/${id}`, data),

  // DELETE /api/users/me/experiences/{id}
  deleteExperience: (id) => api.delete(`/users/me/experiences/${id}`),

  // ==================== EDUCATIONS ====================
  // GET /api/users/me/educations
  getEducations: () => api.get("/users/me/educations"),

  // POST /api/users/me/educations
  // Body: { schoolName, major, degree, startYear, endYear, description }
  addEducation: (data) => api.post("/users/me/educations", data),

  // PUT /api/users/me/educations/{id}
  updateEducation: (id, data) => api.put(`/users/me/educations/${id}`, data),

  // DELETE /api/users/me/educations/{id}
  deleteEducation: (id) => api.delete(`/users/me/educations/${id}`),

  // ==================== CHANGE PASSWORD ====================
  // PUT /api/Users/change-password
  changePassword: (data) => api.put("/Users/change-password", data),

  // ==================== SYSTEM SKILLS ====================
  // GET /api/Skills
  getAllSkills: () => api.get("/Skills"),

  // GET /api/Skills/search?q=...
  searchSkills: (q) => api.get("/Skills/search", { params: { q } }),
};

export default userService;
    