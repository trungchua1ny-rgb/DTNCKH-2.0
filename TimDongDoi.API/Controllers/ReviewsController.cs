using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Review;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    // ============================================
    // CREATE REVIEWS
    // ============================================

    /// <summary>
    /// Tạo review cho job application
    /// </summary>
    [HttpPost("jobs")]
    [Authorize(Roles = "user,company")]
    public async Task<IActionResult> CreateJobReview([FromBody] CreateJobReviewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reviewService.CreateJobReviewAsync(userId, request);
            return Ok(new { success = true, data = result, message = "Đánh giá thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Tạo review cho project member
    /// </summary>
    [HttpPost("projects")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> CreateProjectReview([FromBody] CreateProjectReviewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reviewService.CreateProjectReviewAsync(userId, request);
            return Ok(new { success = true, data = result, message = "Đánh giá thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ============================================
    // READ REVIEWS
    // ============================================

    /// <summary>
    /// Lấy review theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetReviewById(int id)
    {
        try
        {
            int? userId = User.Identity?.IsAuthenticated == true ? GetCurrentUserId() : null;
            var result = await _reviewService.GetReviewByIdAsync(id, userId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách reviews của user (Public)
    /// </summary>
    [HttpGet("users/{userId}")]
    public async Task<IActionResult> GetUserReviews(int userId, [FromQuery] ReviewSearchRequest request)
    {
        try
        {
            request.ToUserId = userId;
            // ✅ Đã thêm logic lấy currentUserId để truyền xuống Service
            int? currentUserId = User.Identity?.IsAuthenticated == true ? GetCurrentUserId() : null;
            
            var (reviews, total) = await _reviewService.GetUserReviewsAsync(userId, request, currentUserId);
            
            return Ok(new
            {
                success = true,
                data = reviews,
                pagination = new
                {
                    total,
                    page = request.Page,
                    pageSize = request.PageSize,
                    totalPages = (int)Math.Ceiling(total / (double)request.PageSize)
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy reviews user đã viết
    /// </summary>
    [HttpGet("my-reviews")]
    [Authorize]
    public async Task<IActionResult> GetMyReviews([FromQuery] ReviewSearchRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var (reviews, total) = await _reviewService.GetReviewsByUserAsync(userId, request);
            return Ok(new
            {
                success = true,
                data = reviews,
                pagination = new
                {
                    total,
                    page = request.Page,
                    pageSize = request.PageSize,
                    totalPages = (int)Math.Ceiling(total / (double)request.PageSize)
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thống kê reviews của user (Public)
    /// </summary>
    [HttpGet("users/{userId}/stats")]
    public async Task<IActionResult> GetUserReviewStats(int userId)
    {
        try
        {
            var result = await _reviewService.GetUserReviewStatsAsync(userId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy summary đánh giá của user (Public)
    /// </summary>
    [HttpGet("users/{userId}/summary")]
    public async Task<IActionResult> GetUserReviewSummary(int userId)
    {
        try
        {
            var result = await _reviewService.GetUserReviewSummaryAsync(userId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Kiểm tra có thể review job không
    /// </summary>
    [HttpGet("can-review/jobs/{applicationId}/users/{toUserId}")]
    [Authorize]
    public async Task<IActionResult> CanReviewJob(int applicationId, int toUserId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reviewService.CanReviewJobAsync(userId, applicationId, toUserId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Kiểm tra có thể review project không
    /// </summary>
    [HttpGet("can-review/projects/{projectMemberId}/users/{toUserId}")]
    [Authorize]
    public async Task<IActionResult> CanReviewProject(int projectMemberId, int toUserId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reviewService.CanReviewProjectAsync(userId, projectMemberId, toUserId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ============================================
    // UPDATE & DELETE REVIEWS
    // ============================================

    /// <summary>
    /// Cập nhật review (trong 7 ngày)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reviewService.UpdateReviewAsync(userId, id, request);
            return Ok(new { success = true, data = result, message = "Cập nhật đánh giá thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa review
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _reviewService.DeleteReviewAsync(userId, id);
            return Ok(new { success = true, message = "Xóa đánh giá thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Ẩn/hiện review (chỉ người nhận)
    /// </summary>
    [HttpPut("{id}/toggle-visibility")]
    [Authorize]
    public async Task<IActionResult> ToggleVisibility(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _reviewService.ToggleVisibilityAsync(userId, id);
            return Ok(new { success = true, data = result, message = "Đã thay đổi trạng thái hiển thị" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /// <summary>
    /// Admin xem tất cả reviews
    /// </summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAllReviews([FromQuery] ReviewSearchRequest request)
    {
        try
        {
            var (reviews, total) = await _reviewService.GetAllReviewsAsync(request);
            return Ok(new
            {
                success = true,
                data = reviews,
                pagination = new
                {
                    total,
                    page = request.Page,
                    pageSize = request.PageSize,
                    totalPages = (int)Math.Ceiling(total / (double)request.PageSize)
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Admin xóa review vi phạm
    /// </summary>
    [HttpDelete("admin/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdminDeleteReview(int id, [FromBody] string reason)
    {
        try
        {
            var adminId = GetCurrentUserId();
            await _reviewService.AdminDeleteReviewAsync(adminId, id, reason);
            return Ok(new { success = true, message = "Đã xóa review vi phạm" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ============================================
    // HELPER
    // ============================================

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}