import api from "./api";

const companyService = {
  // ==================== PUBLIC ====================

  // GET /api/companies — danh sách tất cả công ty
  getAllCompanies: (params) => api.get("/companies", { params }),

  // GET /api/companies/search?keyword=&industry=&size=&page=&pageSize=
  searchCompanies: (params) => api.get("/companies", { params }),

  // GET /api/companies/{id} — xem công ty công khai
  getCompanyById: (id) => api.get(`/companies/${id}`),

  // ==================== COMPANY ROLE ====================

  // GET /api/companies/me — lấy thông tin công ty của mình
  getMyCompany: () => api.get("/companies/me"),

  // POST /api/companies — tạo công ty
  // Body: { name, description, website, industry, size, foundedYear }
  createCompany: (data) => api.post("/companies", data),

  // PUT /api/companies/me — cập nhật công ty
  updateCompany: (data) => api.put("/companies/me", data),

  // DELETE /api/companies/me — xóa công ty
  deleteCompany: () => api.delete("/companies/me"),

  // ==================== UPLOAD ====================

  // POST /api/companies/me/logo — upload logo
  uploadLogo: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/companies/me/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // POST /api/companies/me/images — upload ảnh công ty
  uploadImage: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/companies/me/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ==================== VERIFICATION ====================

  // POST /api/companies/me/verification — gửi yêu cầu xác minh
  // Body: FormData { documentType, notes, document(file) }
  submitVerification: (data, file) => {
    const form = new FormData();
    form.append("documentType", data.documentType);
    if (data.notes) form.append("notes", data.notes);
    form.append("document", file);
    return api.post("/companies/me/verification", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // GET /api/companies/me/verification — lịch sử xác minh
  getMyVerifications: () => api.get("/companies/me/verification"),

  // ==================== LOCATIONS ====================

  // GET /api/companies/{id}/locations — địa điểm công ty
  getLocations: (companyId) => api.get(`/companies/${companyId}/locations`),

  // POST /api/companies/me/locations — thêm địa điểm
  // Body: { address, city, country, isHeadquarter }
  addLocation: (data) => api.post("/companies/me/locations", data),

  // PUT /api/companies/me/locations/{id} — sửa địa điểm
  updateLocation: (id, data) => api.put(`/companies/me/locations/${id}`, data),

  // DELETE /api/companies/me/locations/{id} — xóa địa điểm
  deleteLocation: (id) => api.delete(`/companies/me/locations/${id}`),
  
};

export default companyService;
