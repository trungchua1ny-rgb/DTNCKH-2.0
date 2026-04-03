using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;

    public RecommendationsController(IRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    // ============================================
    // USER RECOMMENDATIONS
    // ============================================

    /// <summary>
    /// Gợi ý jobs phù hợp cho user
    /// </summary>
    [HttpGet("jobs")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> GetRecommendedJobs([FromQuery] int count = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _recommendationService.GetRecommendedJobsForUserAsync(userId, count);
            
            return Ok(new 
            { 
                success = true, 
                data = result,
                total = result.Count,
                message = result.Any() 
                    ? $"Tìm thấy {result.Count} công việc phù hợp với bạn" 
                    : "Không tìm thấy công việc phù hợp. Hãy cập nhật thêm skills!"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Gợi ý projects phù hợp cho user
    /// </summary>
    [HttpGet("projects")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> GetRecommendedProjects([FromQuery] int count = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _recommendationService.GetRecommendedProjectsForUserAsync(userId, count);
            
            return Ok(new 
            { 
                success = true, 
                data = result,
                total = result.Count,
                message = result.Any() 
                    ? $"Tìm thấy {result.Count} dự án phù hợp với bạn" 
                    : "Không tìm thấy dự án phù hợp. Hãy cập nhật thêm skills!"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thống kê recommendations
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> GetRecommendationStats()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _recommendationService.GetRecommendationStatsForUserAsync(userId);
            
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ============================================
    // COMPANY RECOMMENDATIONS
    // ============================================

    /// <summary>
    /// Gợi ý candidates cho job
    /// </summary>
    [HttpGet("jobs/{jobId}/candidates")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> GetRecommendedCandidatesForJob(int jobId, [FromQuery] int count = 20)
    {
        try
        {
            var result = await _recommendationService.GetRecommendedCandidatesForJobAsync(jobId, count);
            
            return Ok(new 
            { 
                success = true, 
                data = result,
                total = result.Count,
                message = result.Any() 
                    ? $"Tìm thấy {result.Count} ứng viên phù hợp" 
                    : "Không tìm thấy ứng viên phù hợp"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Gợi ý candidates cho project
    /// </summary>
    [HttpGet("projects/{projectId}/candidates")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> GetRecommendedCandidatesForProject(int projectId, [FromQuery] int count = 20)
    {
        try
        {
            var result = await _recommendationService.GetRecommendedCandidatesForProjectAsync(projectId, count);
            
            return Ok(new 
            { 
                success = true, 
                data = result,
                total = result.Count,
                message = result.Any() 
                    ? $"Tìm thấy {result.Count} ứng viên phù hợp" 
                    : "Không tìm thấy ứng viên phù hợp"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ============================================
    // MATCHING SCORES
    // ============================================

    /// <summary>
    /// Tính match score giữa user và job
    /// </summary>
    [HttpGet("jobs/{jobId}/match")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> CalculateJobMatchScore(int jobId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var score = await _recommendationService.CalculateJobMatchScoreAsync(userId, jobId);
            var breakdown = await _recommendationService.GetMatchScoreBreakdownAsync(userId, jobId);
            
            return Ok(new 
            { 
                success = true, 
                data = new 
                {
                    matchScore = Math.Round(score, 1),
                    matchLevel = GetMatchLevel(score),
                    breakdown
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Tính match score giữa user và project
    /// </summary>
    [HttpGet("projects/{projectId}/match")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> CalculateProjectMatchScore(int projectId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var score = await _recommendationService.CalculateProjectMatchScoreAsync(userId, projectId);
            
            return Ok(new 
            { 
                success = true, 
                data = new 
                {
                    matchScore = Math.Round(score, 1),
                    matchLevel = GetMatchLevel(score)
                }
            });
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

    private string GetMatchLevel(double score)
    {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Poor";
    }
}
