using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Admin;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    // ==================== DASHBOARD ====================

    // GET /api/admin/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        try
        {
            var result = await _adminService.GetDashboardStats();
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/admin/dashboard/monthly?months=6
    [HttpGet("dashboard/monthly")]
    public async Task<IActionResult> GetMonthlyStats([FromQuery] int months = 6)
    {
        try
        {
            if (months < 1 || months > 24)
                return BadRequest(new { success = false, message = "months must be between 1 and 24" });

            var result = await _adminService.GetMonthlyStats(months);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== USER MANAGEMENT ====================

    // GET /api/admin/users?search=&role=&status=&page=1&pageSize=20
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUserFilterRequest filter)
    {
        try
        {
            var result = await _adminService.GetUsers(filter);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/admin/users/{id}
    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        try
        {
            var result = await _adminService.GetUserById(id);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== COMPANY MANAGEMENT ====================

    // GET /api/admin/companies?search=&verificationStatus=&page=1&pageSize=20
    [HttpGet("companies")]
    public async Task<IActionResult> GetCompanies(
        [FromQuery] string? search = null,
        [FromQuery] string? verificationStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminService.GetCompanies(search, verificationStatus, page, pageSize);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== JOB MANAGEMENT ====================

    // GET /api/admin/jobs?search=&status=&page=1&pageSize=20
    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminService.GetJobs(search, status, page, pageSize);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // DELETE /api/admin/jobs/{id}
    [HttpDelete("jobs/{id}")]
    public async Task<IActionResult> DeleteJob(int id, [FromBody] DeleteContentRequest request)
    {
        try
        {
            var adminId = GetCurrentUserId();
            await _adminService.DeleteJob(adminId, id, request.Reason);
            return Ok(new { success = true, message = "Job deleted successfully" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== PROJECT MANAGEMENT ====================

    // GET /api/admin/projects?search=&status=&page=1&pageSize=20
    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminService.GetProjects(search, status, page, pageSize);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // DELETE /api/admin/projects/{id}
    [HttpDelete("projects/{id}")]
    public async Task<IActionResult> DeleteProject(int id, [FromBody] DeleteContentRequest request)
    {
        try
        {
            var adminId = GetCurrentUserId();
            await _adminService.DeleteProject(adminId, id, request.Reason);
            return Ok(new { success = true, message = "Project deleted successfully" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== ADMIN LOGS ====================

    // GET /api/admin/logs?page=1&pageSize=20&action=
    [HttpGet("logs")]
    public async Task<IActionResult> GetAdminLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? action = null)
    {
        try
        {
            var result = await _adminService.GetAdminLogs(page, pageSize, action);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== EXPORT ====================

    // GET /api/admin/export/users
    [HttpGet("export/users")]
    public async Task<IActionResult> ExportUsers()
    {
        try
        {
            var csvBytes = await _adminService.ExportUsersCsv();
            return File(csvBytes, "text/csv", $"users_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/admin/export/jobs
    [HttpGet("export/jobs")]
    public async Task<IActionResult> ExportJobs()
    {
        try
        {
            var csvBytes = await _adminService.ExportJobsCsv();
            return File(csvBytes, "text/csv", $"jobs_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }
}