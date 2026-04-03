using TimDongDoi.API.DTOs.Company;

namespace TimDongDoi.API.Services.Interfaces
{
    /// <summary>
    /// Interface cho Company Service
    /// Module E: Company Management
    /// </summary>
    public interface ICompanyService
    {
        // ============================================
        // UC20: QUẢN LÝ THÔNG TIN CÔNG TY (CRUD)
        // ============================================
        
        /// <summary>
        /// Lấy thông tin công ty của user hiện tại (cho Company role)
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <returns>Thông tin chi tiết công ty</returns>
        Task<CompanyDetailDto> GetMyCompany(int userId);

        /// <summary>
        /// Lấy thông tin công ty theo ID (Public - ai cũng xem được)
        /// </summary>
        /// <param name="companyId">ID của công ty</param>
        /// <returns>Thông tin chi tiết công ty</returns>
        Task<CompanyDetailDto> GetCompanyById(int companyId);

        /// <summary>
        /// Tạo thông tin công ty mới (nếu chưa có)
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="request">Dữ liệu công ty</param>
        /// <returns>Thông tin công ty vừa tạo</returns>
        Task<CompanyDetailDto> CreateCompany(int userId, CreateCompanyRequest request);

        /// <summary>
        /// Cập nhật thông tin công ty
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="request">Dữ liệu cập nhật</param>
        /// <returns>Thông tin công ty sau khi cập nhật</returns>
        Task<CompanyDetailDto> UpdateCompany(int userId, UpdateCompanyRequest request);

        /// <summary>
        /// Xóa thông tin công ty
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        Task DeleteCompany(int userId);

        // ============================================
        // UC21: UPLOAD LOGO/ẢNH CÔNG TY
        // ============================================
        
        /// <summary>
        /// Upload logo công ty
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="file">File logo</param>
        /// <returns>Thông tin file đã upload</returns>
        Task<UploadFileResponse> UploadLogo(int userId, IFormFile file);

        /// <summary>
        /// Upload ảnh công ty (banner, văn phòng...)
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="file">File ảnh</param>
        /// <returns>Thông tin file đã upload</returns>
        Task<UploadFileResponse> UploadImage(int userId, IFormFile file);

        // ============================================
        // UC22: XÁC MINH DOANH NGHIỆP
        // ============================================
        
        /// <summary>
        /// Gửi yêu cầu xác minh công ty (upload giấy phép kinh doanh)
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="request">Thông tin xác minh</param>
        /// <param name="document">File giấy tờ</param>
        /// <returns>Thông tin verification vừa tạo</returns>
        Task<CompanyVerificationDto> SubmitVerification(int userId, SubmitVerificationRequest request, IFormFile document);

        /// <summary>
        /// Lấy trạng thái xác minh của công ty
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <returns>Danh sách verification requests</returns>
        Task<List<CompanyVerificationDto>> GetMyVerifications(int userId);

        /// <summary>
        /// [ADMIN] Lấy danh sách yêu cầu xác minh chờ duyệt
        /// </summary>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số lượng items/trang</param>
        /// <returns>Danh sách verification chờ duyệt</returns>
        Task<List<CompanyVerificationDto>> GetPendingVerifications(int page = 1, int pageSize = 20);

        /// <summary>
        /// [ADMIN] Duyệt hoặc từ chối xác minh
        /// </summary>
        /// <param name="adminUserId">ID của admin</param>
        /// <param name="verificationId">ID của verification request</param>
        /// <param name="request">Action (approve/reject) và notes</param>
        /// <returns>Verification đã được xử lý</returns>
        Task<CompanyVerificationDto> ProcessVerification(int adminUserId, int verificationId, ProcessVerificationRequest request);

        // ============================================
        // QUẢN LÝ ĐỊA ĐIỂM
        // ============================================
        
        /// <summary>
        /// Lấy danh sách địa điểm của công ty
        /// </summary>
        /// <param name="companyId">ID của công ty</param>
        /// <returns>Danh sách locations</returns>
        Task<List<CompanyLocationDto>> GetCompanyLocations(int companyId);

        /// <summary>
        /// Thêm địa điểm mới
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="request">Thông tin địa điểm</param>
        /// <returns>Location vừa tạo</returns>
        Task<CompanyLocationDto> AddLocation(int userId, AddLocationRequest request);

        /// <summary>
        /// Cập nhật địa điểm
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="locationId">ID của location</param>
        /// <param name="request">Dữ liệu cập nhật</param>
        /// <returns>Location sau khi cập nhật</returns>
        Task<CompanyLocationDto> UpdateLocation(int userId, int locationId, UpdateLocationRequest request);

        /// <summary>
        /// Xóa địa điểm
        /// </summary>
        /// <param name="userId">ID của user đang đăng nhập</param>
        /// <param name="locationId">ID của location</param>
        Task DeleteLocation(int userId, int locationId);

        // ============================================
        // SEARCH & FILTER (PUBLIC)
        // ============================================
        
        /// <summary>
        /// Tìm kiếm công ty (Public)
        /// </summary>
        /// <param name="keyword">Từ khóa tìm kiếm</param>
        /// <param name="industry">Lọc theo ngành nghề</param>
        /// <param name="size">Lọc theo quy mô</param>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số lượng items/trang</param>
        /// <returns>Danh sách công ty</returns>
        Task<List<CompanyDto>> SearchCompanies(string? keyword, string? industry, string? size, int page = 1, int pageSize = 20);

        /// <summary>
        /// Lấy danh sách tất cả công ty (có phân trang)
        /// </summary>
        /// <param name="page">Trang hiện tại</param>
        /// <param name="pageSize">Số lượng items/trang</param>
        /// <returns>Danh sách công ty</returns>
        Task<List<CompanyDto>> GetAllCompanies(int page = 1, int pageSize = 20);
    }
}