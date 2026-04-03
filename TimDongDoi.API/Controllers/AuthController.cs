using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimDongDoi.API.DTOs.Auth;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // ============================================
        // ĐĂNG KÝ USER (NGƯỜI TÌM VIỆC)
        // ============================================
        /// <summary>
        /// Đăng ký tài khoản người tìm việc (role: user)
        /// </summary>
        [HttpPost("register/user")]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterRequest request)
        {
            try
            {
                var user = await _authService.RegisterUser(request);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Đăng ký tài khoản User thành công",
                    Data = new
                    {
                        UserId = user.Id,
                        Email = user.Email,
                        FullName = user.FullName,
                        Role = user.Role
                    }
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server: " + ex.Message });
            }
        }

        // ============================================
        // ĐĂNG KÝ COMPANY (DOANH NGHIỆP)
        // ============================================
        /// <summary>
        /// Đăng ký tài khoản doanh nghiệp (role: company)
        /// Tạo cả User account và Company profile
        /// </summary>
        [HttpPost("register/company")]
        public async Task<IActionResult> RegisterCompany([FromBody] RegisterCompanyRequest request)
        {
            try
            {
                var (user, company) = await _authService.RegisterCompany(request);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Đăng ký tài khoản Company thành công",
                    Data = new
                    {
                        UserId = user.Id,
                        Email = user.Email,
                        FullName = user.FullName,
                        Role = user.Role,
                        Company = new
                        {
                            CompanyId = company.Id,
                            CompanyName = company.Name,
                            Industry = company.Industry,
                            VerificationStatus = company.VerificationStatus
                        }
                    }
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server: " + ex.Message });
            }
        }

        // ============================================
        // ĐĂNG KÝ ADMIN (CHỈ ADMIN HIỆN TẠI MỚI TẠO ĐƯỢC)
        // ============================================
        /// <summary>
        /// Đăng ký tài khoản Admin (chỉ Admin hiện tại mới được gọi)
        /// Yêu cầu JWT token với role = admin
        /// </summary>
        [HttpPost("register/admin")]
        [Authorize(Roles = "admin")] // ⚠️ CHỈ ADMIN MỚI GỌI ĐƯỢC
        public async Task<IActionResult> RegisterAdmin([FromBody] RegisterAdminRequest request)
        {
            try
            {
                var admin = await _authService.RegisterAdmin(request);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Đăng ký tài khoản Admin thành công",
                    Data = new
                    {
                        UserId = admin.Id,
                        Email = admin.Email,
                        FullName = admin.FullName,
                        Role = admin.Role
                    }
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server: " + ex.Message });
            }
        }

        // ============================================
        // ĐĂNG NHẬP (CHO TẤT CẢ LOẠI TÀI KHOẢN)
        // ============================================
        /// <summary>
        /// Đăng nhập và lấy JWT Token
        /// Hỗ trợ tất cả role: user, company, admin
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.Login(request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return Unauthorized(new { Success = false, Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "Lỗi server: " + ex.Message });
            }
        }

        // ============================================
        // TEST ENDPOINT - XEM THÔNG TIN USER HIỆN TẠI
        // ============================================
        /// <summary>
        /// Test endpoint để xem thông tin user từ JWT token
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

            return Ok(new
            {
                Success = true,
                Data = new
                {
                    UserId = userId,
                    Email = email,
                    Role = role,
                    FullName = name
                }
            });
        }
    }
}