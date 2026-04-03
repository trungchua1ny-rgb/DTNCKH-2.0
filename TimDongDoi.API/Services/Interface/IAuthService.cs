using TimDongDoi.API.DTOs.Auth;
using TimDongDoi.API.Models;

namespace TimDongDoi.API.Services.Interfaces
{
    public interface IAuthService
    {
        // ===== ĐĂNG KÝ =====
        /// <summary>
        /// Đăng ký tài khoản User (người tìm việc)
        /// </summary>
        Task<User> RegisterUser(RegisterRequest request);

        /// <summary>
        /// Đăng ký tài khoản Company (doanh nghiệp)
        /// Tạo cả User và Company record
        /// </summary>
        Task<(User user, Company company)> RegisterCompany(RegisterCompanyRequest request);

        /// <summary>
        /// Đăng ký tài khoản Admin (chỉ Admin hiện tại mới được gọi)
        /// </summary>
        Task<User> RegisterAdmin(RegisterAdminRequest request);

        // ===== ĐĂNG NHẬP =====
        /// <summary>
        /// Đăng nhập và trả về LoginResponse với token + user info
        /// </summary>
        Task<LoginResponse> Login(LoginRequest request);

        // ===== HELPER =====
        /// <summary>
        /// Tạo JWT token từ user object
        /// </summary>
        string CreateToken(User user);
    }
}