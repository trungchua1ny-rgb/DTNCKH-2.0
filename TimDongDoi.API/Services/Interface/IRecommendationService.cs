using TimDongDoi.API.DTOs.Recommendation;

namespace TimDongDoi.API.Services.Interfaces;

public interface IRecommendationService
{
    // ============================================
    // USER RECOMMENDATIONS
    // ============================================
    
    /// <summary>
    /// Gợi ý jobs phù hợp cho user
    /// </summary>
    Task<List<JobRecommendationDto>> GetRecommendedJobsForUserAsync(int userId, int count = 20);
    
    /// <summary>
    /// Gợi ý projects phù hợp cho user
    /// </summary>
    Task<List<ProjectRecommendationDto>> GetRecommendedProjectsForUserAsync(int userId, int count = 20);
    
    /// <summary>
    /// Lấy thống kê recommendations cho user
    /// </summary>
    Task<RecommendationStatsDto> GetRecommendationStatsForUserAsync(int userId);
    
    // ============================================
    // COMPANY RECOMMENDATIONS
    // ============================================
    
    /// <summary>
    /// Gợi ý candidates phù hợp cho job
    /// </summary>
    Task<List<CandidateRecommendationDto>> GetRecommendedCandidatesForJobAsync(int jobId, int count = 20);
    
    /// <summary>
    /// Gợi ý candidates phù hợp cho project
    /// </summary>
    Task<List<CandidateRecommendationDto>> GetRecommendedCandidatesForProjectAsync(int projectId, int count = 20);
    
    // ============================================
    // MATCHING SCORES
    // ============================================
    
    /// <summary>
    /// Tính match score giữa user và job
    /// </summary>
    Task<double> CalculateJobMatchScoreAsync(int userId, int jobId);
    
    /// <summary>
    /// Tính match score giữa user và project
    /// </summary>
    Task<double> CalculateProjectMatchScoreAsync(int userId, int projectId);
    
    /// <summary>
    /// Tính match score chi tiết với breakdown
    /// </summary>
    Task<MatchScoreBreakdown> GetMatchScoreBreakdownAsync(int userId, int jobId);
}