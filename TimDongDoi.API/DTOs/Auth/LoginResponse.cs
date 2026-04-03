namespace TimDongDoi.API.DTOs.Auth
{
    public class LoginResponse
    {
        public bool Success { get; set; } = true;
        public string Token { get; set; } = string.Empty;
        public UserLoginDto User { get; set; } = null!;
    }

    public class UserLoginDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
    }
}