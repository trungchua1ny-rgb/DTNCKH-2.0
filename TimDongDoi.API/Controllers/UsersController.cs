using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimDongDoi.API.DTOs.User;
using TimDongDoi.API.Services.Interfaces;
using System.Net;

namespace TimDongDoi.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // GET /api/Users/profile/me
        [HttpGet("profile/me")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            try
            {
                int userId = _userService.GetUserIdFromClaims();
                var profile = await _userService.GetUserProfile(userId);
                return Ok(new { Message = "Lấy hồ sơ thành công.", Data = profile });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { Message = "JWT Token không hợp lệ hoặc thiếu thông tin người dùng." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError,
                    new { Message = "Lỗi server khi lấy hồ sơ.", Detail = ex.Message });
            }
        }

        // PUT /api/Users/profile/me
        [HttpPut("profile/me")]
        public async Task<IActionResult> UpdateCurrentUserProfile([FromBody] UserUpdateDto updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Message = "Dữ liệu không hợp lệ.", Errors = ModelState });

            try
            {
                int userId = _userService.GetUserIdFromClaims();
                var updatedProfile = await _userService.UpdateUserProfile(userId, updateDto);
                return Ok(new { Message = "Cập nhật hồ sơ thành công.", Data = updatedProfile });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { Message = "JWT Token không hợp lệ hoặc thiếu thông tin người dùng." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.InternalServerError,
                    new { Message = "Lỗi server khi cập nhật hồ sơ.", Detail = ex.Message });
            }
        }

        // GET /api/Users/{id} - Xem profile công khai
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProfile(int id)
        {
            try
            {
                var profile = await _userService.GetUserProfile(id);
                return Ok(new { message = "Lấy hồ sơ thành công.", data = profile });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = ex.Message });
            }
        }

        // PUT /api/Users/change-password
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                var userId = _userService.GetUserIdFromClaims();
                await _userService.ChangePassword(userId, dto);
                return Ok(new { success = true, message = "Đổi mật khẩu thành công" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Không có quyền truy cập." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}