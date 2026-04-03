using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Review;

// ============================================
// REQUEST DTOs
// ============================================

public class CreateJobReviewRequest
{
    [Required(ErrorMessage = "Application ID không được để trống")]
    public int ApplicationId { get; set; }

    [Required(ErrorMessage = "User ID được đánh giá không được để trống")]
    public int ToUserId { get; set; }

    [Required(ErrorMessage = "Rating không được để trống")]
    [Range(1, 5, ErrorMessage = "Rating phải từ 1-5 sao")]
    public int Rating { get; set; }

    [Required(ErrorMessage = "Comment không được để trống")]
    [StringLength(2000, MinimumLength = 20, ErrorMessage = "Comment phải từ 20-2000 ký tự")]
    public string Comment { get; set; } = string.Empty;
}

public class CreateProjectReviewRequest
{
    [Required(ErrorMessage = "Project member ID không được để trống")]
    public int ProjectMemberId { get; set; }

    [Required(ErrorMessage = "User ID được đánh giá không được để trống")]
    public int ToUserId { get; set; }

    [Required(ErrorMessage = "Rating không được để trống")]
    [Range(1, 5, ErrorMessage = "Rating phải từ 1-5 sao")]
    public int Rating { get; set; }

    [Required(ErrorMessage = "Comment không được để trống")]
    [StringLength(2000, MinimumLength = 20, ErrorMessage = "Comment phải từ 20-2000 ký tự")]
    public string Comment { get; set; } = string.Empty;
}

public class UpdateReviewRequest
{
    [Range(1, 5, ErrorMessage = "Rating phải từ 1-5 sao")]
    public int? Rating { get; set; }

    [StringLength(2000, MinimumLength = 20, ErrorMessage = "Comment phải từ 20-2000 ký tự")]
    public string? Comment { get; set; }
}

public class ReviewSearchRequest
{
    public int? ToUserId { get; set; }
    public int? FromUserId { get; set; }
    public string? Type { get; set; } // job, project
    public int? MinRating { get; set; }
    public int? MaxRating { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ============================================
// RESPONSE DTOs
// ============================================

public class ReviewDto
{
    public int Id { get; set; }
    public int FromUserId { get; set; }
    public string FromUserName { get; set; } = string.Empty;
    public string? FromUserAvatar { get; set; }
    public string? FromUserJobTitle { get; set; }
    
    public int ToUserId { get; set; }
    public string ToUserName { get; set; } = string.Empty;
    public string? ToUserAvatar { get; set; }
    public string? ToUserJobTitle { get; set; }
    
    public int? ApplicationId { get; set; }
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    
    public int? ProjectMemberId { get; set; }
    public string? ProjectTitle { get; set; }
    
    public string Type { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool IsVisible { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}

public class ReviewStatsDto
{
    public int TotalReviews { get; set; }
    public double AverageRating { get; set; }
    
    public int FiveStars { get; set; }
    public int FourStars { get; set; }
    public int ThreeStars { get; set; }
    public int TwoStars { get; set; }
    public int OneStar { get; set; }
    
    public int JobReviews { get; set; }
    public int ProjectReviews { get; set; }
    
    public List<ReviewDto> RecentReviews { get; set; } = new();
}

public class UserReviewSummaryDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    
    public double AsEmployerRating { get; set; }
    public int AsEmployerReviews { get; set; }
    
    public double AsEmployeeRating { get; set; }
    public int AsEmployeeReviews { get; set; }
    
    public double AsProjectOwnerRating { get; set; }
    public int AsProjectOwnerReviews { get; set; }
    
    public double AsProjectMemberRating { get; set; }
    public int AsProjectMemberReviews { get; set; }
}

public class CanReviewDto
{
    public bool CanReview { get; set; }
    public string? Reason { get; set; }
    public int? ApplicationId { get; set; }
    public int? ProjectMemberId { get; set; }
}