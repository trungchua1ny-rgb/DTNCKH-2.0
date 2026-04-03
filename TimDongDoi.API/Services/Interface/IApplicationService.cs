using TimDongDoi.API.DTOs.Application;

namespace TimDongDoi.API.Services.Interfaces
{
    /// <summary>
    /// Interface cho Application Service - Module G
    /// </summary>
    public interface IApplicationService
    {
        // ============================================
        // UC13: ỨNG VIÊN ỨNG TUYỂN
        // ============================================
        
        /// <summary>
        /// User apply job
        /// </summary>
        /// <param name="userId">ID của user</param>
        /// <param name="jobId">ID của job</param>
        /// <param name="request">Cover letter</param>
        /// <param name="cvFile">CV file (optional)</param>
        /// <returns>Application vừa tạo</returns>
        Task<ApplicationDto> ApplyJob(int userId, int jobId, ApplyJobRequest request, IFormFile? cvFile);

        // ============================================
        // UC14: USER QUẢN LÝ ĐƠN ỨNG TUYỂN
        // ============================================
        
        /// <summary>
        /// User xem danh sách đơn ứng tuyển của mình
        /// </summary>
        /// <param name="userId">ID của user</param>
        /// <param name="status">Filter theo status (optional)</param>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số items/trang</param>
        /// <returns>Danh sách applications</returns>
        Task<List<ApplicationDto>> GetMyApplications(int userId, string? status, int page = 1, int pageSize = 20);

        /// <summary>
        /// User xem chi tiết đơn ứng tuyển
        /// </summary>
        /// <param name="userId">ID của user</param>
        /// <param name="applicationId">ID của application</param>
        /// <returns>Chi tiết application</returns>
        Task<ApplicationDto> GetApplicationById(int userId, int applicationId);

        /// <summary>
        /// User rút đơn ứng tuyển (chỉ khi status = pending)
        /// </summary>
        /// <param name="userId">ID của user</param>
        /// <param name="applicationId">ID của application</param>
        Task WithdrawApplication(int userId, int applicationId);

        // ============================================
        // UC29-33: COMPANY QUẢN LÝ ỨNG VIÊN
        // ============================================
        
        /// <summary>
        /// Company xem danh sách ứng viên của một job
        /// </summary>
        /// <param name="companyUserId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        /// <param name="status">Filter theo status</param>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số items/trang</param>
        /// <returns>Danh sách applications</returns>
        Task<List<ApplicationDto>> GetJobApplications(int companyUserId, int jobId, string? status, int page = 1, int pageSize = 20);

        /// <summary>
        /// Company xem chi tiết một ứng viên
        /// </summary>
        /// <param name="companyUserId">ID của user (company)</param>
        /// <param name="applicationId">ID của application</param>
        /// <returns>Chi tiết application</returns>
        Task<ApplicationDto> GetApplicationForCompany(int companyUserId, int applicationId);

        /// <summary>
        /// Company update status application (reviewing, interview, accepted, rejected)
        /// </summary>
        /// <param name="companyUserId">ID của user (company)</param>
        /// <param name="applicationId">ID của application</param>
        /// <param name="request">Status mới và lý do (nếu reject)</param>
        /// <returns>Application sau khi update</returns>
        Task<ApplicationDto> UpdateApplicationStatus(int companyUserId, int applicationId, UpdateApplicationStatusRequest request);

        /// <summary>
        /// Company accept ứng viên (shortcut cho update status = accepted)
        /// </summary>
        Task<ApplicationDto> AcceptApplication(int companyUserId, int applicationId);

        /// <summary>
        /// Company reject ứng viên (shortcut cho update status = rejected)
        /// </summary>
        Task<ApplicationDto> RejectApplication(int companyUserId, int applicationId, string reason);

        // ============================================
        // STATISTICS
        // ============================================
        
        /// <summary>
        /// Company xem thống kê ứng viên của job
        /// </summary>
        /// <param name="companyUserId">ID của user (company)</param>
        /// <param name="jobId">ID của job</param>
        /// <returns>Thống kê</returns>
        Task<ApplicationStatsDto> GetJobApplicationStats(int companyUserId, int jobId);
    }

    /// <summary>
    /// DTO cho thống kê applications
    /// </summary>
    public class ApplicationStatsDto
    {
        public int Total { get; set; } = 0;
        public int Pending { get; set; } = 0;
        public int Reviewing { get; set; } = 0;
        public int Interview { get; set; } = 0;
        public int Accepted { get; set; } = 0;
        public int Rejected { get; set; } = 0;
    }
}