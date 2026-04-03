using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Auth;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ============================================
        // ĐĂNG KÝ USER (NGƯỜI TÌM VIỆC)
        // ============================================
        public async Task<User> RegisterUser(RegisterRequest request)
        {
            // Kiểm tra email đã tồn tại
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                throw new InvalidOperationException("Email đã được sử dụng.");
            }

            var newUser = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                Phone = request.Phone,
                JobTitle = request.JobTitle,
                Birthday = request.Birthday,
                Role = "user", // Hardcode role = user
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                PasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(request.Password)),
                PasswordSalt = new byte[0] // BCrypt không cần salt riêng
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return newUser;
        }

        // ============================================
        // ĐĂNG KÝ COMPANY (DOANH NGHIỆP)
        // ============================================
        public async Task<(User user, Company company)> RegisterCompany(RegisterCompanyRequest request)
        {
            // Kiểm tra email đã tồn tại
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                throw new InvalidOperationException("Email đã được sử dụng.");
            }

            // Bắt đầu transaction để đảm bảo tạo cả User và Company
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Tạo User account với role = "company"
                var newUser = new User
                {
                    Email = request.Email,
                    FullName = request.FullName,
                    Phone = request.Phone,
                    Role = "company", // Hardcode role = company
                    Status = "active",
                    CreatedAt = DateTime.UtcNow,
                    PasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(request.Password)),
                    PasswordSalt = new byte[0]
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync(); // Lưu để có User.Id

                // 2. Tạo Company profile liên kết với User
                var newCompany = new Company
                {
                    UserId = newUser.Id,
                    Name = request.CompanyName,
                    Description = request.Description,
                    Website = request.Website,
                    Industry = request.Industry,
                    Size = request.Size,
                    FoundedYear = request.FoundedYear,
                    VerificationStatus = "pending", // Mặc định chờ xác minh
                    CreatedAt = DateTime.UtcNow
                };

                _context.Companies.Add(newCompany);
                await _context.SaveChangesAsync();

                // Commit transaction
                await transaction.CommitAsync();

                return (newUser, newCompany);
            }
            catch (Exception)
            {
                // Rollback nếu có lỗi
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ============================================
        // ĐĂNG KÝ ADMIN (CHỈ ADMIN HIỆN TẠI MỚI TẠO ĐƯỢC)
        // ============================================
        public async Task<User> RegisterAdmin(RegisterAdminRequest request)
        {
            // Kiểm tra email đã tồn tại
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                throw new InvalidOperationException("Email đã được sử dụng.");
            }

            var newAdmin = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                Phone = request.Phone,
                Role = "admin", // Hardcode role = admin
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                PasswordHash = Encoding.UTF8.GetBytes(BCrypt.Net.BCrypt.HashPassword(request.Password)),
                PasswordSalt = new byte[0]
            };

            _context.Users.Add(newAdmin);
            await _context.SaveChangesAsync();

            return newAdmin;
        }

        // ============================================
        // ĐĂNG NHẬP
        // ============================================
        public async Task<LoginResponse> Login(LoginRequest request)
        {
            // Tìm user theo email
            var user = await _context.Users
                .Include(u => u.Company) // Include Company nếu role = company
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                throw new KeyNotFoundException("Email hoặc mật khẩu không đúng.");
            }

            // Kiểm tra tài khoản có bị khóa không
            if (user.Status == "blocked" || user.Status == "inactive")
            {
                throw new UnauthorizedAccessException("Tài khoản đã bị khóa hoặc chưa được kích hoạt.");
            }
            if (user.Status == "banned")
            {
                throw new UnauthorizedAccessException("Tài khoản của bạn đã bị cấm do vi phạm chính sách cộng đồng.");
            }

            // Verify password
            var storedHash = Encoding.UTF8.GetString(user.PasswordHash);
            if (!BCrypt.Net.BCrypt.Verify(request.Password, storedHash))
            {
                throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");
            }

            // Tạo token
            var token = CreateToken(user);

            // Trả về LoginResponse với đầy đủ thông tin
            var response = new LoginResponse
            {
                Success = true,
                Token = token,
                User = new UserLoginDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role,
                    Avatar = user.Avatar
                }
            };

            return response;
        }

        // ============================================
        // TẠO JWT TOKEN
        // ============================================
        public string CreateToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");

            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];

            // Claims cơ bản
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}