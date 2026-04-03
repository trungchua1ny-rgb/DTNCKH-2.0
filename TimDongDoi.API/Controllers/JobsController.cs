using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Job;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    /// <summary>
    /// Controller quản lý tin tuyển dụng - Module F
    /// </summary>
    [Route("api/jobs")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly IJobService _jobService;

        public JobsController(IJobService jobService)
        {
            _jobService = jobService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private int? GetCurrentUserIdOrNull()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(userIdClaim) ? null : int.Parse(userIdClaim);
        }

        // ============================================
        // UC23 & UC24: CRUD TIN TUYỂN DỤNG
        // ============================================

        /// <summary>
        /// [POST] /api/jobs - Company tạo job mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var job = await _jobService.CreateJob(userId, request);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Tạo tin tuyển dụng thành công",
                    Data = job
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [GET] /api/jobs/my - Company xem danh sách jobs của mình
        /// </summary>
        [HttpGet("my")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> GetMyJobs(
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var jobs = await _jobService.GetMyJobs(userId, status, page, pageSize);

                return Ok(new
                {
                    Success = true,
                    Data = jobs,
                    Page = page,
                    PageSize = pageSize,
                    Total = jobs.Count
                });
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
        /// [GET] /api/jobs/{id} - Xem chi tiết job (Public)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobById(int id)
        {
            try
            {
                var userId = GetCurrentUserIdOrNull();
                var job = await _jobService.GetJobById(id, userId);

                return Ok(new { Success = true, Data = job });
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
        /// [PUT] /api/jobs/{id} - Company cập nhật job
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] UpdateJobRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var job = await _jobService.UpdateJob(userId, id, request);

                return Ok(new
                {
                    Success = true,
                    Message = "Cập nhật tin tuyển dụng thành công",
                    Data = job
                });
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
        /// [DELETE] /api/jobs/{id} - Company xóa job
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _jobService.DeleteJob(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Xóa tin tuyển dụng thành công"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // UC25: SAO CHÉP TIN TUYỂN DỤNG
        // ============================================

        /// <summary>
        /// [POST] /api/jobs/{id}/clone - Sao chép job
        /// </summary>
        [HttpPost("{id}/clone")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> CloneJob(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var job = await _jobService.CloneJob(userId, id);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Sao chép tin tuyển dụng thành công",
                    Data = job
                });
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
        // UC26: ĐÓNG/MỞ TIN TUYỂN DỤNG
        // ============================================

        /// <summary>
        /// [PUT] /api/jobs/{id}/close - Đóng tin tuyển dụng
        /// </summary>
        [HttpPut("{id}/close")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> CloseJob(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _jobService.CloseJob(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã đóng tin tuyển dụng"
                });
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
        /// [PUT] /api/jobs/{id}/reopen - Mở lại tin tuyển dụng
        /// </summary>
        [HttpPut("{id}/reopen")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> ReopenJob(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _jobService.ReopenJob(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã mở lại tin tuyển dụng"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [PUT] /api/jobs/{id}/publish - Publish job từ draft
        /// </summary>
        [HttpPut("{id}/publish")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> PublishJob(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _jobService.PublishJob(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã xuất bản tin tuyển dụng"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // UC27: THỐNG KÊ TIN TUYỂN DỤNG
        // ============================================

        /// <summary>
        /// [GET] /api/jobs/{id}/stats - Lấy thống kê job
        /// </summary>
        [HttpGet("{id}/stats")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> GetJobStats(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var stats = await _jobService.GetJobStats(userId, id);

                return Ok(new { Success = true, Data = stats });
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
        // QUẢN LÝ SKILLS CỦA JOB
        // ============================================

        /// <summary>
        /// [GET] /api/jobs/{id}/skills - Lấy danh sách skills của job
        /// </summary>
        [HttpGet("{id}/skills")]
        public async Task<IActionResult> GetJobSkills(int id)
        {
            try
            {
                var skills = await _jobService.GetJobSkills(id);
                return Ok(new { Success = true, Data = skills });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [POST] /api/jobs/{id}/skills - Thêm skill vào job
        /// </summary>
        [HttpPost("{id}/skills")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> AddJobSkill(int id, [FromBody] AddJobSkillRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var skill = await _jobService.AddJobSkill(userId, id, request);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Thêm skill thành công",
                    Data = skill
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [DELETE] /api/jobs/{id}/skills/{skillId} - Xóa skill khỏi job
        /// </summary>
        [HttpDelete("{id}/skills/{skillId}")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> RemoveJobSkill(int id, int skillId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _jobService.RemoveJobSkill(userId, id, skillId);

                return Ok(new
                {
                    Success = true,
                    Message = "Xóa skill thành công"
                });
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
        // SEARCH & FILTER (PUBLIC)
        // ============================================

        /// <summary>
        /// [GET] /api/jobs - Tìm kiếm jobs (Public)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> SearchJobs(
            [FromQuery] string? keyword,
            [FromQuery] string? location,
            [FromQuery] string? type,
            [FromQuery] string? level,
            [FromQuery] int? salaryMin,
            [FromQuery] int? salaryMax,
            [FromQuery] string? skills,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var jobs = await _jobService.SearchJobs(
                    keyword, location, type, level, salaryMin, salaryMax, skills, page, pageSize);

                return Ok(new
                {
                    Success = true,
                    Data = jobs,
                    Page = page,
                    PageSize = pageSize,
                    Total = jobs.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [GET] /api/jobs/featured - Lấy jobs nổi bật
        /// </summary>
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedJobs([FromQuery] int limit = 10)
        {
            try
            {
                var jobs = await _jobService.GetFeaturedJobs(limit);
                return Ok(new { Success = true, Data = jobs });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [GET] /api/jobs/company/{companyId} - Lấy jobs của một company
        /// </summary>
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetJobsByCompany(
            int companyId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var jobs = await _jobService.GetJobsByCompany(companyId, page, pageSize);
                return Ok(new
                {
                    Success = true,
                    Data = jobs,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // SAVED JOBS (USER LƯU TIN)
        // ============================================

        /// <summary>
        /// [POST] /api/jobs/{id}/save - User lưu tin
        /// </summary>
        [HttpPost("{id}/save")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> SaveJob(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _jobService.SaveJob(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã lưu tin tuyển dụng"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [DELETE] /api/jobs/{id}/save - User bỏ lưu tin
        /// </summary>
        [HttpDelete("{id}/save")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> UnsaveJob(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _jobService.UnsaveJob(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã bỏ lưu tin tuyển dụng"
                });
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
        /// [GET] /api/jobs/saved - User xem danh sách tin đã lưu
        /// </summary>
        [HttpGet("saved")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetSavedJobs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var jobs = await _jobService.GetSavedJobs(userId, page, pageSize);

                return Ok(new
                {
                    Success = true,
                    Data = jobs,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }
    }
}