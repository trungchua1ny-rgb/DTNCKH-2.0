using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Application;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    /// <summary>
    /// Controller quản lý đơn ứng tuyển - Module G
    /// </summary>
    [Route("api/applications")]
    [ApiController]
    public class ApplicationsController : ControllerBase
    {
        private readonly IApplicationService _applicationService;

        public ApplicationsController(IApplicationService applicationService)
        {
            _applicationService = applicationService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        // ============================================
        // UC13: ỨNG VIÊN ỨNG TUYỂN
        // ============================================

        /// <summary>
        /// [POST] /api/applications/jobs/{jobId} - User apply job
        /// </summary>
        [HttpPost("jobs/{jobId}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> ApplyJob(
            int jobId,
            [FromForm] ApplyJobRequest request,
            IFormFile? cvFile)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _applicationService.ApplyJob(userId, jobId, request, cvFile);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Ứng tuyển thành công! Chúc bạn may mắn.",
                    Data = application
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
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // UC14: USER QUẢN LÝ ĐƠN ỨNG TUYỂN
        // ============================================

        /// <summary>
        /// [GET] /api/applications/my - User xem danh sách đơn ứng tuyển của mình
        /// </summary>
        [HttpGet("my")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetMyApplications(
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var applications = await _applicationService.GetMyApplications(userId, status, page, pageSize);

                return Ok(new
                {
                    Success = true,
                    Data = applications,
                    Page = page,
                    PageSize = pageSize,
                    Total = applications.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [GET] /api/applications/{id} - User xem chi tiết đơn ứng tuyển
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetApplicationById(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _applicationService.GetApplicationById(userId, id);

                return Ok(new { Success = true, Data = application });
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
        /// [DELETE] /api/applications/{id} - User rút đơn ứng tuyển
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> WithdrawApplication(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _applicationService.WithdrawApplication(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã rút đơn ứng tuyển"
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
        // UC29-33: COMPANY QUẢN LÝ ỨNG VIÊN
        // ============================================

        /// <summary>
        /// [GET] /api/applications/jobs/{jobId} - Company xem danh sách ứng viên của job
        /// </summary>
        [HttpGet("jobs/{jobId}")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> GetJobApplications(
            int jobId,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var applications = await _applicationService.GetJobApplications(userId, jobId, status, page, pageSize);

                return Ok(new
                {
                    Success = true,
                    Data = applications,
                    Page = page,
                    PageSize = pageSize,
                    Total = applications.Count
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
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
        /// [GET] /api/applications/{id}/company - Company xem chi tiết ứng viên
        /// </summary>
        [HttpGet("{id}/company")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> GetApplicationForCompany(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _applicationService.GetApplicationForCompany(userId, id);

                return Ok(new { Success = true, Data = application });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
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
        /// [PUT] /api/applications/{id}/status - Company update status application
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> UpdateApplicationStatus(
            int id,
            [FromBody] UpdateApplicationStatusRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _applicationService.UpdateApplicationStatus(userId, id, request);

                var message = request.Status.ToLower() switch
                {
                    "reviewing" => "Đã chuyển hồ sơ sang trạng thái 'Đang xem xét'",
                    "interview" => "Đã mời ứng viên phỏng vấn",
                    "accepted" => "Đã chấp nhận ứng viên",
                    "rejected" => "Đã từ chối ứng viên",
                    _ => "Đã cập nhật trạng thái"
                };

                return Ok(new
                {
                    Success = true,
                    Message = message,
                    Data = application
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
        /// [PUT] /api/applications/{id}/accept - Company accept ứng viên (shortcut)
        /// </summary>
        [HttpPut("{id}/accept")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> AcceptApplication(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _applicationService.AcceptApplication(userId, id);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã chấp nhận ứng viên",
                    Data = application
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
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
        /// [PUT] /api/applications/{id}/reject - Company reject ứng viên (shortcut)
        /// </summary>
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> RejectApplication(
            int id,
            [FromBody] RejectApplicationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _applicationService.RejectApplication(userId, id, request.Reason);

                return Ok(new
                {
                    Success = true,
                    Message = "Đã từ chối ứng viên",
                    Data = application
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
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

        // ============================================
        // STATISTICS
        // ============================================

        /// <summary>
        /// [GET] /api/applications/jobs/{jobId}/stats - Company xem thống kê ứng viên
        /// </summary>
        [HttpGet("jobs/{jobId}/stats")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> GetJobApplicationStats(int jobId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var stats = await _applicationService.GetJobApplicationStats(userId, jobId);

                return Ok(new { Success = true, Data = stats });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
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
    }

    /// <summary>
    /// DTO để reject application
    /// </summary>
    public class RejectApplicationRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}