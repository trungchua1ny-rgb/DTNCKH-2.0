using TimDongDoi.API.DTOs.Job;

namespace TimDongDoi.API.Services.Interfaces
{
    /// <summary>
    /// Interface cho Job Service - Module F
    /// </summary>
    public interface IJobService
    {
        // ============================================
        // UC23 & UC24: QUẢN LÝ TIN TUYỂN DỤNG (CRUD)
        // ============================================
        
        /// <summary>
        /// Company tạo job mới
        /// </summary>
        /// <param name="userId">ID của user (company) đang đăng nhập</param>
        /// <param name="request">Dữ liệu job</param>
        /// <returns>Job vừa tạo</returns>
        Task<JobDetailDto> CreateJob(int userId, CreateJobRequest request);

        /// <summary>
        /// Company lấy danh sách jobs của mình
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="status">Filter theo status (open/closed/draft)</param>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số items/trang</param>
        /// <returns>Danh sách jobs</returns>
        Task<List<JobDto>> GetMyJobs(int userId, string? status, int page = 1, int pageSize = 20);

        /// <summary>
        /// Lấy chi tiết job theo ID (Public - ai cũng xem được)
        /// </summary>
        /// <param name="jobId">ID của job</param>
        /// <param name="userId">ID của user đang xem (để check IsSaved, HasApplied)</param>
        /// <returns>Chi tiết job</returns>
        Task<JobDetailDto> GetJobById(int jobId, int? userId = null);

        /// <summary>
        /// Company cập nhật job
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job cần update</param>
        /// <param name="request">Dữ liệu cập nhật</param>
        /// <returns>Job sau khi update</returns>
        Task<JobDetailDto> UpdateJob(int userId, int jobId, UpdateJobRequest request);

        /// <summary>
        /// Company xóa job
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job cần xóa</param>
        Task DeleteJob(int userId, int jobId);

        // ============================================
        // UC25: SAO CHÉP TIN TUYỂN DỤNG
        // ============================================
        
        /// <summary>
        /// Sao chép job (clone) để tạo job mới tương tự
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job gốc</param>
        /// <returns>Job mới được clone</returns>
        Task<JobDetailDto> CloneJob(int userId, int jobId);

        // ============================================
        // UC26: ĐÓNG/MỞ TIN TUYỂN DỤNG
        // ============================================
        
        /// <summary>
        /// Đóng tin tuyển dụng (status = closed)
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        Task CloseJob(int userId, int jobId);

        /// <summary>
        /// Mở lại tin tuyển dụng (status = open)
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        Task ReopenJob(int userId, int jobId);

        /// <summary>
        /// Chuyển job từ draft sang open (publish)
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        Task PublishJob(int userId, int jobId);

        // ============================================
        // UC27: THỐNG KÊ TIN TUYỂN DỤNG
        // ============================================
        
        /// <summary>
        /// Lấy thống kê chi tiết của job
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        /// <returns>Thống kê job</returns>
        Task<JobStatsDto> GetJobStats(int userId, int jobId);

        // ============================================
        // QUẢN LÝ SKILLS CỦA JOB
        // ============================================
        
        /// <summary>
        /// Lấy danh sách skills của job
        /// </summary>
        /// <param name="jobId">ID của job</param>
        /// <returns>Danh sách skills</returns>
        Task<List<JobSkillDto>> GetJobSkills(int jobId);

        /// <summary>
        /// Thêm skill vào job
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        /// <param name="request">Thông tin skill</param>
        /// <returns>JobSkill vừa thêm</returns>
        Task<JobSkillDto> AddJobSkill(int userId, int jobId, AddJobSkillRequest request);

        /// <summary>
        /// Xóa skill khỏi job
        /// </summary>
        /// <param name="userId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        /// <param name="skillId">ID của skill cần xóa</param>
        Task RemoveJobSkill(int userId, int jobId, int skillId);

        // ============================================
        // SEARCH & FILTER JOBS (PUBLIC)
        // ============================================
        
        /// <summary>
        /// Tìm kiếm jobs (Public)
        /// </summary>
        /// <param name="keyword">Từ khóa tìm kiếm (title, description)</param>
        /// <param name="location">Địa điểm</param>
        /// <param name="type">Loại hình (full-time, part-time...)</param>
        /// <param name="level">Cấp bậc (junior, senior...)</param>
        /// <param name="salaryMin">Lương tối thiểu</param>
        /// <param name="salaryMax">Lương tối đa</param>
        /// <param name="skills">Danh sách skill IDs (comma-separated)</param>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số items/trang</param>
        /// <returns>Danh sách jobs</returns>
        Task<List<JobDto>> SearchJobs(
            string? keyword, 
            string? location, 
            string? type, 
            string? level,
            int? salaryMin,
            int? salaryMax,
            string? skills,
            int page = 1, 
            int pageSize = 20);

        /// <summary>
        /// Lấy danh sách jobs nổi bật (nhiều views, mới nhất)
        /// </summary>
        /// <param name="limit">Số lượng jobs</param>
        /// <returns>Danh sách jobs</returns>
        Task<List<JobDto>> GetFeaturedJobs(int limit = 10);

        /// <summary>
        /// Lấy danh sách jobs của một company (Public)
        /// </summary>
        /// <param name="companyId">ID của company</param>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số items/trang</param>
        /// <returns>Danh sách jobs</returns>
        Task<List<JobDto>> GetJobsByCompany(int companyId, int page = 1, int pageSize = 20);

        // ============================================
        // SAVED JOBS (USER LƯU TIN)
        // ============================================
        
        /// <summary>
        /// User lưu tin tuyển dụng
        /// </summary>
        /// <param name="userId">ID của user</param>
        /// <param name="jobId">ID của job</param>
        Task SaveJob(int userId, int jobId);

        /// <summary>
        /// User bỏ lưu tin
        /// </summary>
        /// <param name="userId">ID của user</param>
        /// <param name="jobId">ID của job</param>
        Task UnsaveJob(int userId, int jobId);

        /// <summary>
        /// Lấy danh sách jobs đã lưu của user
        /// </summary>
        /// <param name="userId">ID của user</param>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số items/trang</param>
        /// <returns>Danh sách jobs đã lưu</returns>
        Task<List<JobDto>> GetSavedJobs(int userId, int page = 1, int pageSize = 20);

        // ============================================
        // HELPER: TĂNG VIEW COUNT
        // ============================================
        
        /// <summary>
        /// Tăng view count khi user xem job
        /// </summary>
        /// <param name="jobId">ID của job</param>
        Task IncrementViewCount(int jobId);
    }
}