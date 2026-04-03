using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Report;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    // POST /api/reports
    [HttpPost]
    [Authorize(Roles = "user,company")]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reportService.CreateReport(userId, request);
            return Ok(new { success = true, message = "Report submitted", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/reports/my
    [HttpGet("my")]
    [Authorize(Roles = "user,company")]
    public async Task<IActionResult> GetMyReports(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reportService.GetMyReports(userId, page, pageSize);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/reports
    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAllReports(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null)
    {
        try
        {
            var result = await _reportService.GetAllReports(page, pageSize, status, type);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/reports/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetReportById(int id)
    {
        try
        {
            var result = await _reportService.GetReportById(id);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // PUT /api/reports/{id}/handle
    // Nếu report type = "user" và muốn ban → truyền thêm BanAction
    [HttpPut("{id}/handle")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> HandleReport(int id, [FromBody] HandleReportRequest request)
    {
        try
        {
            var adminId = GetCurrentUserId();
            var result = await _reportService.HandleReport(adminId, id, request);
            return Ok(new { success = true, message = "Report handled", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // PUT /api/reports/users/{userId}/unban
    [HttpPut("users/{userId}/unban")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UnbanUser(int userId)
    {
        try
        {
            var adminId = GetCurrentUserId();
            await _reportService.UnbanUser(adminId, userId);
            return Ok(new { success = true, message = "User has been unbanned" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/reports/users/{userId}/status
    [HttpGet("users/{userId}/status")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetUserStatus(int userId)
    {
        try
        {
            var result = await _reportService.GetUserStatus(userId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }
}