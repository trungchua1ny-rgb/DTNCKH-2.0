using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.User;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    [Authorize]
    [Route("api/users/me")]
    [ApiController]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileService _profileService;

        public UserProfileController(IUserProfileService profileService)
        {
            _profileService = profileService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        // ============================================
        // UPLOAD AVATAR & CV
        // ============================================

        /// <summary>
        /// [POST] /api/users/me/avatar - Upload avatar
        /// </summary>
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { Success = false, Message = "File không được để trống" });

                var userId = GetCurrentUserId();
                var path = await _profileService.UploadAvatar(userId, file);

                return Ok(new { Success = true, Message = "Upload avatar thành công", Data = new { avatarUrl = path } });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [POST] /api/users/me/cv - Upload CV
        /// </summary>
        [HttpPost("cv")]
        public async Task<IActionResult> UploadCv(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { Success = false, Message = "File không được để trống" });

                var userId = GetCurrentUserId();
                var path = await _profileService.UploadCv(userId, file);

                return Ok(new { Success = true, Message = "Upload CV thành công", Data = new { cvUrl = path } });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // EXPERIENCES
        // ============================================

        /// <summary>
        /// [GET] /api/users/me/experiences
        /// </summary>
        [HttpGet("experiences")]
        public async Task<IActionResult> GetExperiences()
        {
            try
            {
                var userId = GetCurrentUserId();
                var data = await _profileService.GetExperiences(userId);
                return Ok(new { Success = true, Data = data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [POST] /api/users/me/experiences
        /// </summary>
        [HttpPost("experiences")]
        public async Task<IActionResult> AddExperience([FromBody] UserExperienceRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var data = await _profileService.AddExperience(userId, request);
                return StatusCode(201, new { Success = true, Message = "Đã thêm kinh nghiệm", Data = data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [PUT] /api/users/me/experiences/{id}
        /// </summary>
        [HttpPut("experiences/{id}")]
        public async Task<IActionResult> UpdateExperience(int id, [FromBody] UserExperienceRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var data = await _profileService.UpdateExperience(userId, id, request);
                return Ok(new { Success = true, Message = "Đã cập nhật kinh nghiệm", Data = data });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [DELETE] /api/users/me/experiences/{id}
        /// </summary>
        [HttpDelete("experiences/{id}")]
        public async Task<IActionResult> DeleteExperience(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _profileService.DeleteExperience(userId, id);
                return Ok(new { Success = true, Message = "Đã xóa kinh nghiệm" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // EDUCATIONS
        // ============================================

        /// <summary>
        /// [GET] /api/users/me/educations
        /// </summary>
        [HttpGet("educations")]
        public async Task<IActionResult> GetEducations()
        {
            try
            {
                var userId = GetCurrentUserId();
                var data = await _profileService.GetEducations(userId);
                return Ok(new { Success = true, Data = data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [POST] /api/users/me/educations
        /// </summary>
        [HttpPost("educations")]
        public async Task<IActionResult> AddEducation([FromBody] UserEducationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var data = await _profileService.AddEducation(userId, request);
                return StatusCode(201, new { Success = true, Message = "Đã thêm học vấn", Data = data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [PUT] /api/users/me/educations/{id}
        /// </summary>
        [HttpPut("educations/{id}")]
        public async Task<IActionResult> UpdateEducation(int id, [FromBody] UserEducationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var data = await _profileService.UpdateEducation(userId, id, request);
                return Ok(new { Success = true, Message = "Đã cập nhật học vấn", Data = data });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [DELETE] /api/users/me/educations/{id}
        /// </summary>
        [HttpDelete("educations/{id}")]
        public async Task<IActionResult> DeleteEducation(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _profileService.DeleteEducation(userId, id);
                return Ok(new { Success = true, Message = "Đã xóa học vấn" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }
    }
}