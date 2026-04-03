using TimDongDoi.API.DTOs.Review;

namespace TimDongDoi.API.Services.Interfaces;

public interface IReviewService
{
    // ============================================
    // CREATE REVIEWS
    // ============================================
    
    /// <summary>
    /// Tạo review cho job application
    /// </summary>
    Task<ReviewDto> CreateJobReviewAsync(int fromUserId, CreateJobReviewRequest request);
    
    /// <summary>
    /// Tạo review cho project member
    /// </summary>
    Task<ReviewDto> CreateProjectReviewAsync(int fromUserId, CreateProjectReviewRequest request);
    
    // ============================================
    // READ REVIEWS
    // ============================================
    
    /// <summary>
    /// Lấy review theo ID
    /// </summary>
    Task<ReviewDto> GetReviewByIdAsync(int reviewId, int? currentUserId = null);
    
    /// <summary>
    /// Lấy danh sách reviews của một user (nhận được)
    /// </summary>
    Task<(List<ReviewDto> Reviews, int Total)> GetUserReviewsAsync(int userId, ReviewSearchRequest request, int? currentUserId = null);
    
    /// <summary>
    /// Lấy danh sách reviews user đã viết
    /// </summary>
    Task<(List<ReviewDto> Reviews, int Total)> GetReviewsByUserAsync(int userId, ReviewSearchRequest request);
    
    /// <summary>
    /// Lấy thống kê reviews của user
    /// </summary>
    Task<ReviewStatsDto> GetUserReviewStatsAsync(int userId);
    
    /// <summary>
    /// Lấy summary đánh giá của user (hiển thị trên profile)
    /// </summary>
    Task<UserReviewSummaryDto> GetUserReviewSummaryAsync(int userId);
    
    /// <summary>
    /// Kiểm tra xem có thể review không
    /// </summary>
    Task<CanReviewDto> CanReviewJobAsync(int fromUserId, int applicationId, int toUserId);
    
    /// <summary>
    /// Kiểm tra xem có thể review project member không
    /// </summary>
    Task<CanReviewDto> CanReviewProjectAsync(int fromUserId, int projectMemberId, int toUserId);
    
    // ============================================
    // UPDATE & DELETE REVIEWS
    // ============================================
    
    /// <summary>
    /// Cập nhật review (chỉ người tạo trong 7 ngày)
    /// </summary>
    Task<ReviewDto> UpdateReviewAsync(int userId, int reviewId, UpdateReviewRequest request);
    
    /// <summary>
    /// Xóa review (chỉ người tạo hoặc admin)
    /// </summary>
    Task DeleteReviewAsync(int userId, int reviewId, bool isAdmin = false);
    
    /// <summary>
    /// Ẩn/hiện review
    /// </summary>
    Task<ReviewDto> ToggleVisibilityAsync(int userId, int reviewId);
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /// <summary>
    /// Admin xem tất cả reviews (kể cả ẩn)
    /// </summary>
    Task<(List<ReviewDto> Reviews, int Total)> GetAllReviewsAsync(ReviewSearchRequest request);
    
    /// <summary>
    /// Admin xóa review vi phạm
    /// </summary>
    Task AdminDeleteReviewAsync(int adminId, int reviewId, string reason);
}