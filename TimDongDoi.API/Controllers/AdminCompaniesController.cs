using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Company;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    /// <summary>
    /// Controller cho Admin quản lý công ty
    /// </summary>
    [Route("api/admin/companies")]
    [ApiController]
    [Authorize(Roles = "admin")] // ⚠️ CHỈ ADMIN MỚI TRUY CẬP ĐƯỢC
    public class AdminCompaniesController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public AdminCompaniesController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        // ============================================
        // UC22: ADMIN QUẢN LÝ XÁC MINH DOANH NGHIỆP
        // ============================================

        /// <summary>
        /// [GET] /api/admin/companies/verifications - Xem danh sách chờ duyệt
        /// </summary>
        [HttpGet("verifications")]
        public async Task<IActionResult> GetPendingVerifications(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var verifications = await _companyService.GetPendingVerifications(page, pageSize);
                return Ok(new
                {
                    Success = true,
                    Data = verifications,
                    Page = page,
                    PageSize = pageSize,
                    Total = verifications.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [PUT] /api/admin/companies/verifications/{id} - Duyệt/Từ chối xác minh
        /// </summary>
        [HttpPut("verifications/{id}")]
        public async Task<IActionResult> ProcessVerification(
            int id,
            [FromBody] ProcessVerificationRequest request)
        {
            try
            {
                var adminUserId = GetCurrentUserId();
                var result = await _companyService.ProcessVerification(adminUserId, id, request);

                var message = request.Action.ToLower() == "approve"
                    ? "Đã duyệt xác minh công ty thành công"
                    : "Đã từ chối xác minh công ty";

                return Ok(new
                {
                    Success = true,
                    Message = message,
                    Data = result
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
    }
}