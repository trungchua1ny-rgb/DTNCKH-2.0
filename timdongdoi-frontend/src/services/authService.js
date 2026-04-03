import api from "./api";

export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),

  registerUser: (data) => api.post("/auth/register/user", data),

  registerCompany: (data) => api.post("/auth/register/company", data),

  getMe: () => api.get("/auth/me"),
};
