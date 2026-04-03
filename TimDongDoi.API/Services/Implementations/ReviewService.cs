using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Review;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations;

public class ReviewService : IReviewService
{
    private readonly AppDbContext _context;

    public ReviewService(AppDbContext context)
    {
        _context = context;
    }

    // ============================================
    // CREATE REVIEWS
    // ============================================

    public async Task<ReviewDto> CreateJobReviewAsync(int fromUserId, CreateJobReviewRequest request)
    {
        var application = await _context.Applications
            .Include(a => a.Job)
            .ThenInclude(j => j!.Company)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId);

        if (application == null)
            throw new KeyNotFoundException("Đơn ứng tuyển không tồn tại");

        if (application.Status != "accepted")
            throw new InvalidOperationException("Chỉ có thể đánh giá sau khi ứng viên được chấp nhận");

        var canReview = await CanReviewJobAsync(fromUserId, request.ApplicationId, request.ToUserId);
        if (!canReview.CanReview)
            throw new InvalidOperationException(canReview.Reason ?? "Không thể đánh giá");

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ApplicationId == request.ApplicationId && 
                                     r.FromUserId == fromUserId);

        if (existingReview != null)
            throw new InvalidOperationException("Bạn đã đánh giá rồi");

        var review = new Review
        {
            FromUserId = fromUserId,
            ToUserId = request.ToUserId,
            ApplicationId = request.ApplicationId,
            Type = "job",
            Rating = request.Rating,
            Comment = request.Comment,
            IsVisible = true,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return await MapToReviewDto(review, fromUserId);
    }

    public async Task<ReviewDto> CreateProjectReviewAsync(int fromUserId, CreateProjectReviewRequest request)
    {
        var projectMember = await _context.ProjectMembers
            .Include(pm => pm.Project)
            .FirstOrDefaultAsync(pm => pm.Id == request.ProjectMemberId);

        if (projectMember == null)
            throw new KeyNotFoundException("Thành viên dự án không tồn tại");

        var canReview = await CanReviewProjectAsync(fromUserId, request.ProjectMemberId, request.ToUserId);
        if (!canReview.CanReview)
            throw new InvalidOperationException(canReview.Reason ?? "Không thể đánh giá");

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ProjectMemberId == request.ProjectMemberId && 
                                     r.FromUserId == fromUserId);

        if (existingReview != null)
            throw new InvalidOperationException("Bạn đã đánh giá rồi");

        var review = new Review
        {
            FromUserId = fromUserId,
            ToUserId = request.ToUserId,
            ProjectMemberId = request.ProjectMemberId,
            Type = "project",
            Rating = request.Rating,
            Comment = request.Comment,
            IsVisible = true,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return await MapToReviewDto(review, fromUserId);
    }

    // ============================================
    // READ REVIEWS
    // ============================================

    public async Task<ReviewDto> GetReviewByIdAsync(int reviewId, int? currentUserId = null)
    {
        var review = await _context.Reviews
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == reviewId);

        if (review == null)
            throw new KeyNotFoundException("Review không tồn tại");

        var isVisible = review.IsVisible ?? false;
        if (!isVisible && review.FromUserId != currentUserId && review.ToUserId != currentUserId)
            throw new UnauthorizedAccessException("Review này đã bị ẩn");

        return await MapToReviewDto(review, currentUserId);
    }

    public async Task<(List<ReviewDto> Reviews, int Total)> GetUserReviewsAsync(int userId, ReviewSearchRequest request, int? currentUserId = null)
{
    // 1. Bước đầu chỉ lọc lấy tất cả đánh giá của userId này
    var query = _context.Reviews
        .AsNoTracking()
        .Where(r => r.ToUserId == userId);

    // 2. LOGIC QUAN TRỌNG: 
    // Nếu người đang xem KHÔNG PHẢI là chủ tài khoản (hoặc chưa đăng nhập),
    // thì chỉ cho phép lấy những bài đánh giá đang được hiển thị (IsVisible == true)
    if (currentUserId == null || currentUserId != userId)
    {
        query = query.Where(r => r.IsVisible == true);
    }

    // 3. Các bộ lọc (Filter) giữ nguyên
    if (!string.IsNullOrWhiteSpace(request.Type))
        query = query.Where(r => r.Type == request.Type);

    if (request.MinRating.HasValue)
        query = query.Where(r => r.Rating >= request.MinRating.Value);
        
    if (request.MaxRating.HasValue)
        query = query.Where(r => r.Rating <= request.MaxRating.Value);

    var total = await query.CountAsync();

    var reviews = await query
        .OrderByDescending(r => r.CreatedAt)
        .Skip((request.Page - 1) * request.PageSize)
        .Take(request.PageSize)
        .ToListAsync();

    var result = new List<ReviewDto>();
    foreach (var review in reviews)
    {
        // Nhớ truyền thêm currentUserId vào MapToReviewDto nếu hàm map của bạn có hỗ trợ
        result.Add(await MapToReviewDto(review, currentUserId));
    }

    return (result, total);
}

    public async Task<(List<ReviewDto> Reviews, int Total)> GetReviewsByUserAsync(int userId, ReviewSearchRequest request)
    {
        var query = _context.Reviews
            .AsNoTracking()
            .Where(r => r.FromUserId == userId);

        if (!string.IsNullOrWhiteSpace(request.Type))
            query = query.Where(r => r.Type == request.Type);

        var total = await query.CountAsync();

        var reviews = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var result = new List<ReviewDto>();
        foreach (var review in reviews)
        {
            result.Add(await MapToReviewDto(review, userId));
        }

        return (result, total);
    }

    public async Task<ReviewStatsDto> GetUserReviewStatsAsync(int userId)
    {
        var reviews = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ToUserId == userId && (r.IsVisible ?? false))
            .ToListAsync();

        var recentReviews = reviews
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .ToList();

        var recentDtos = new List<ReviewDto>();
        foreach (var review in recentReviews)
        {
            recentDtos.Add(await MapToReviewDto(review));
        }

        return new ReviewStatsDto
        {
            TotalReviews = reviews.Count,
            AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0,
            FiveStars = reviews.Count(r => r.Rating == 5),
            FourStars = reviews.Count(r => r.Rating == 4),
            ThreeStars = reviews.Count(r => r.Rating == 3),
            TwoStars = reviews.Count(r => r.Rating == 2),
            OneStar = reviews.Count(r => r.Rating == 1),
            JobReviews = reviews.Count(r => r.Type == "job"),
            ProjectReviews = reviews.Count(r => r.Type == "project"),
            RecentReviews = recentDtos
        };
    }

    public async Task<UserReviewSummaryDto> GetUserReviewSummaryAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new KeyNotFoundException("User không tồn tại");

        var receivedReviews = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ToUserId == userId && (r.IsVisible ?? false))
            .ToListAsync();

        // Reviews as Employer
        var asEmployerReviews = new List<Review>();
        var jobApplicationIds = await _context.Applications
            .Where(a => a.Job != null && a.Job.Company != null && a.Job.Company.UserId == userId)
            .Select(a => a.Id)
            .ToListAsync();

        if (jobApplicationIds.Any())
        {
            asEmployerReviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.ToUserId == userId && 
                           r.Type == "job" && 
                           (r.IsVisible ?? false) &&
                           r.ApplicationId.HasValue &&
                           jobApplicationIds.Contains(r.ApplicationId.Value))
                .ToListAsync();
        }

        // Reviews as Employee
        var asEmployeeReviews = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ToUserId == userId && 
                       r.Type == "job" && 
                       (r.IsVisible ?? false) &&
                       r.ApplicationId.HasValue)
            .Join(_context.Applications,
                r => r.ApplicationId!.Value,
                a => a.Id,
                (r, a) => new { r, a })
            .Where(x => x.a.UserId == userId)
            .Select(x => x.r)
            .ToListAsync();

        // Reviews as Project Owner
        var asProjectOwnerReviews = new List<Review>();
        var ownedProjectIds = await _context.Projects
            .Where(p => p.UserId == userId)
            .Select(p => p.Id)
            .ToListAsync();

        if (ownedProjectIds.Any())
        {
            var projectMemberIds = await _context.ProjectMembers
                .Where(pm => ownedProjectIds.Contains(pm.ProjectId))
                .Select(pm => pm.Id)
                .ToListAsync();

            if (projectMemberIds.Any())
            {
                asProjectOwnerReviews = await _context.Reviews
                    .AsNoTracking()
                    .Where(r => r.ToUserId == userId && 
                               r.Type == "project" && 
                               (r.IsVisible ?? false) &&
                               r.ProjectMemberId.HasValue &&
                               projectMemberIds.Contains(r.ProjectMemberId.Value))
                    .ToListAsync();
            }
        }

        // Reviews as Project Member
        var userProjectMemberIds = await _context.ProjectMembers
            .Where(pm => pm.UserId == userId && pm.RoleType == "member")
            .Select(pm => pm.Id)
            .ToListAsync();

        var asProjectMemberReviews = new List<Review>();
        if (userProjectMemberIds.Any())
        {
            asProjectMemberReviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.ToUserId == userId && 
                           r.Type == "project" && 
                           (r.IsVisible ?? false) &&
                           r.ProjectMemberId.HasValue &&
                           userProjectMemberIds.Contains(r.ProjectMemberId.Value))
                .ToListAsync();
        }

        return new UserReviewSummaryDto
        {
            UserId = userId,
            UserName = user.FullName ?? "Unknown",
            UserAvatar = user.Avatar,
            AverageRating = receivedReviews.Any() ? receivedReviews.Average(r => r.Rating) : 0,
            TotalReviews = receivedReviews.Count,
            AsEmployerRating = asEmployerReviews.Any() ? asEmployerReviews.Average(r => r.Rating) : 0,
            AsEmployerReviews = asEmployerReviews.Count,
            AsEmployeeRating = asEmployeeReviews.Any() ? asEmployeeReviews.Average(r => r.Rating) : 0,
            AsEmployeeReviews = asEmployeeReviews.Count,
            AsProjectOwnerRating = asProjectOwnerReviews.Any() ? asProjectOwnerReviews.Average(r => r.Rating) : 0,
            AsProjectOwnerReviews = asProjectOwnerReviews.Count,
            AsProjectMemberRating = asProjectMemberReviews.Any() ? asProjectMemberReviews.Average(r => r.Rating) : 0,
            AsProjectMemberReviews = asProjectMemberReviews.Count
        };
    }

    public async Task<CanReviewDto> CanReviewJobAsync(int fromUserId, int applicationId, int toUserId)
    {
        var application = await _context.Applications
            .Include(a => a.Job)
            .ThenInclude(j => j!.Company)
            .FirstOrDefaultAsync(a => a.Id == applicationId);

        if (application == null)
            return new CanReviewDto { CanReview = false, Reason = "Đơn ứng tuyển không tồn tại" };

        if (application.Status != "accepted")
            return new CanReviewDto { CanReview = false, Reason = "Ứng viên chưa được chấp nhận" };

        var companyUserId = application.Job?.Company?.UserId;
        
        // Employer review Employee
        if (companyUserId.HasValue && fromUserId == companyUserId.Value && toUserId == application.UserId)
            return new CanReviewDto { CanReview = true, ApplicationId = applicationId };

        // Employee review Employer
        if (companyUserId.HasValue && fromUserId == application.UserId && toUserId == companyUserId.Value)
            return new CanReviewDto { CanReview = true, ApplicationId = applicationId };

        return new CanReviewDto { CanReview = false, Reason = "Bạn không có quyền đánh giá" };
    }

    public async Task<CanReviewDto> CanReviewProjectAsync(int fromUserId, int projectMemberId, int toUserId)
    {
        var projectMember = await _context.ProjectMembers
            .Include(pm => pm.Project)
            .FirstOrDefaultAsync(pm => pm.Id == projectMemberId);

        if (projectMember == null)
            return new CanReviewDto { CanReview = false, Reason = "Thành viên dự án không tồn tại" };

        if (projectMember.Status != "active" && projectMember.Status != "left")
            return new CanReviewDto { CanReview = false, Reason = "Thành viên chưa tham gia dự án" };

        var projectOwnerId = projectMember.Project?.UserId;

        // Owner review Member
        if (projectOwnerId.HasValue && fromUserId == projectOwnerId.Value && toUserId == projectMember.UserId)
            return new CanReviewDto { CanReview = true, ProjectMemberId = projectMemberId };

        // Member review Owner
        if (projectOwnerId.HasValue && fromUserId == projectMember.UserId && toUserId == projectOwnerId.Value)
            return new CanReviewDto { CanReview = true, ProjectMemberId = projectMemberId };

        // Member review Member
        var isMember = await _context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectMember.ProjectId && 
                           pm.UserId == fromUserId && 
                           pm.Status == "active");

        if (isMember && toUserId == projectMember.UserId)
            return new CanReviewDto { CanReview = true, ProjectMemberId = projectMemberId };

        return new CanReviewDto { CanReview = false, Reason = "Bạn không có quyền đánh giá" };
    }

    // ============================================
    // UPDATE & DELETE REVIEWS
    // ============================================

    public async Task<ReviewDto> UpdateReviewAsync(int userId, int reviewId, UpdateReviewRequest request)
    {
        var review = await _context.Reviews.FindAsync(reviewId);
        
        if (review == null)
            throw new KeyNotFoundException("Review không tồn tại");

        if (review.FromUserId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền sửa review này");

        var daysSinceCreated = review.CreatedAt.HasValue 
            ? (DateTime.Now - review.CreatedAt.Value).TotalDays 
            : 0;
            
        if (daysSinceCreated > 7)
            throw new InvalidOperationException("Chỉ có thể sửa review trong vòng 7 ngày");

        if (request.Rating.HasValue)
            review.Rating = request.Rating.Value;
        
        if (!string.IsNullOrEmpty(request.Comment))
            review.Comment = request.Comment;

        review.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return await MapToReviewDto(review, userId);
    }

    public async Task DeleteReviewAsync(int userId, int reviewId, bool isAdmin = false)
    {
        var review = await _context.Reviews.FindAsync(reviewId);
        
        if (review == null)
            throw new KeyNotFoundException("Review không tồn tại");

        if (!isAdmin && review.FromUserId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa review này");

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
    }

    public async Task<ReviewDto> ToggleVisibilityAsync(int userId, int reviewId)
    {
        var review = await _context.Reviews.FindAsync(reviewId);
        
        if (review == null)
            throw new KeyNotFoundException("Review không tồn tại");

        if (review.ToUserId != userId)
            throw new UnauthorizedAccessException("Chỉ người nhận review mới có thể ẩn/hiện");

        review.IsVisible = !(review.IsVisible ?? false);
        review.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return await MapToReviewDto(review, userId);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    public async Task<(List<ReviewDto> Reviews, int Total)> GetAllReviewsAsync(ReviewSearchRequest request)
    {
        var query = _context.Reviews.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Type))
            query = query.Where(r => r.Type == request.Type);

        if (request.MinRating.HasValue)
            query = query.Where(r => r.Rating >= request.MinRating.Value);

        var total = await query.CountAsync();

        var reviews = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var result = new List<ReviewDto>();
        foreach (var review in reviews)
        {
            result.Add(await MapToReviewDto(review));
        }

        return (result, total);
    }

    public async Task AdminDeleteReviewAsync(int adminId, int reviewId, string reason)
    {
        var review = await _context.Reviews.FindAsync(reviewId);
        
        if (review == null)
            throw new KeyNotFoundException("Review không tồn tại");

        var adminLog = new AdminLog
        {
            AdminId = adminId,
            Action = "delete",
            TargetType = "review",
            TargetId = reviewId,
            Reason = reason,
            CreatedAt = DateTime.Now
        };
        _context.AdminLogs.Add(adminLog);

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private async Task<ReviewDto> MapToReviewDto(Review review, int? currentUserId = null)
    {
        var fromUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == review.FromUserId);

        var toUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == review.ToUserId);

        Job? job = null;
        Company? company = null;
        Project? project = null;

        if (review.ApplicationId.HasValue)
        {
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j!.Company)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == review.ApplicationId);

            job = application?.Job;
            company = job?.Company;
        }

        if (review.ProjectMemberId.HasValue)
        {
            var projectMember = await _context.ProjectMembers
                .Include(pm => pm.Project)
                .AsNoTracking()
                .FirstOrDefaultAsync(pm => pm.Id == review.ProjectMemberId);

            project = projectMember?.Project;
        }

        var daysSinceCreated = review.CreatedAt.HasValue 
            ? (DateTime.Now - review.CreatedAt.Value).TotalDays 
            : 0;

        return new ReviewDto
        {
            Id = review.Id,
            FromUserId = review.FromUserId,
            FromUserName = fromUser?.FullName ?? "Unknown",
            FromUserAvatar = fromUser?.Avatar,
            FromUserJobTitle = fromUser?.JobTitle,
            ToUserId = review.ToUserId,
            ToUserName = toUser?.FullName ?? "Unknown",
            ToUserAvatar = toUser?.Avatar,
            ToUserJobTitle = toUser?.JobTitle,
            ApplicationId = review.ApplicationId,
            JobTitle = job?.Title,
            CompanyName = company?.Name,
            ProjectMemberId = review.ProjectMemberId,
            ProjectTitle = project?.Title,
            Type = review.Type ?? "",
            Rating = review.Rating,
            Comment = review.Comment ?? "",
            IsVisible = review.IsVisible ?? false,
            CreatedAt = review.CreatedAt ?? DateTime.Now,
            UpdatedAt = review.UpdatedAt ?? DateTime.Now,
            CanEdit = currentUserId.HasValue && review.FromUserId == currentUserId.Value && daysSinceCreated <= 7,
            CanDelete = currentUserId.HasValue && review.FromUserId == currentUserId.Value
        };
    }
}