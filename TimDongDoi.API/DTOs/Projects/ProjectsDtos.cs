using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Project
{
    // ==========================================
    // PROJECT DTOs
    // ==========================================

    public class CreateProjectRequest
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = "side_project"; // startup, freelance, side_project, open_source

        public int? DurationMonths { get; set; }

        [Required]
        public string LocationType { get; set; } = "remote"; // remote, onsite, hybrid

        [Required]
        public string CompensationType { get; set; } = "volunteer"; // equity, revenue_share, paid, volunteer

        public string? CompensationDetails { get; set; }

        public List<CreatePositionDto>? Positions { get; set; }
    }

    public class UpdateProjectRequest
    {
        [StringLength(200)]
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Type { get; set; }
        public int? DurationMonths { get; set; }
        public string? LocationType { get; set; }
        public string? CompensationType { get; set; }
        public string? CompensationDetails { get; set; }
    }

    public class ProjectDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Type { get; set; }
        public int? DurationMonths { get; set; }
        public string? LocationType { get; set; }
        public string? CompensationType { get; set; }
        public string? CompensationDetails { get; set; }
        public string Status { get; set; } = string.Empty;
        public int Views { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public UserBasicDto? Owner { get; set; }
        public List<PositionDto>? Positions { get; set; }
        public ProjectStatsDto? Stats { get; set; }
    }

    public class ProjectListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string? LocationType { get; set; }
        public string? CompensationType { get; set; }
        public string Status { get; set; } = string.Empty;
        public int Views { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserBasicDto? Owner { get; set; }
        public int OpenPositions { get; set; }
        public int TotalApplications { get; set; }
    }

    public class ProjectStatsDto
    {
        public int TotalPositions { get; set; }
        public int OpenPositions { get; set; }
        public int FilledPositions { get; set; }
        public int TotalApplications { get; set; }
        public int PendingApplications { get; set; }
        public int AcceptedApplications { get; set; }
        public int RejectedApplications { get; set; }
        public int TotalMembers { get; set; }
        public int ActiveMembers { get; set; }
        public int Views { get; set; }
    }

    // ==========================================
    // POSITION DTOs
    // ==========================================

    public class CreatePositionDto
    {
        [Required]
        [StringLength(100)]
        public string Role { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public string? Requirements { get; set; }
        public List<int>? RequiredSkillIds { get; set; }
        public List<int>? PreferredSkillIds { get; set; }
    }

    public class UpdatePositionRequest
    {
        [StringLength(100)]
        public string? Role { get; set; }
        public int? Quantity { get; set; }
        public string? Requirements { get; set; }
    }

    public class PositionDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Role { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? Requirements { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<PositionSkillDto>? Skills { get; set; }
        public int TotalApplications { get; set; }
        public int CurrentMembers { get; set; }
    }

    public class PositionSkillDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
    }

    public class AddPositionSkillRequest
    {
        [Required]
        public int SkillId { get; set; }
        public bool IsRequired { get; set; } = true;
    }

    // ==========================================
    // APPLICATION DTOs
    // ==========================================

    public class CreateProjectApplicationRequest
    {
        [Required]
        public int PositionId { get; set; }

        [Required]
        [MinLength(50, ErrorMessage = "Cover letter must be at least 50 characters")]
        public string CoverLetter { get; set; } = string.Empty;

        [Url]
        public string? PortfolioLink { get; set; }
    }

    public class UpdateApplicationStatusRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class ProjectApplicationDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int PositionId { get; set; }
        public int UserId { get; set; }
        public string? CoverLetter { get; set; }
        public string? PortfolioLink { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public ProjectBasicDto? Project { get; set; }
        public PositionBasicDto? Position { get; set; }
        public ApplicantDto? Applicant { get; set; }
    }

    public class ProjectBasicDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string Status { get; set; } = string.Empty;
        public UserBasicDto? Owner { get; set; }
    }

    public class PositionBasicDto
    {
        public int Id { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class ApplicantDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? JobTitle { get; set; }
        public string? Phone { get; set; }
        public List<UserSkillBasicDto>? Skills { get; set; }
    }

    public class UserSkillBasicDto
    {
        public string SkillName { get; set; } = string.Empty;
        public string? Level { get; set; }
        public decimal? YearsExperience { get; set; }
    }

    // ==========================================
    // MEMBER DTOs
    // ==========================================

    public class ProjectMemberDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int UserId { get; set; }
        public int? PositionId { get; set; }
        public string RoleType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateOnly JoinedAt { get; set; }
        public DateOnly? LeftAt { get; set; }
        public UserBasicDto? User { get; set; }
        public PositionBasicDto? Position { get; set; }
    }

    public class AddMemberRequest
    {
        [Required]
        public int UserId { get; set; }
        public int? PositionId { get; set; }
        [Required]
        public string RoleType { get; set; } = "member";
    }

    public class UpdateMemberStatusRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    // ==========================================
    // COMMON DTOs
    // ==========================================

    public class UserBasicDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? JobTitle { get; set; }
    }

    // ==========================================
    // SEARCH & FILTER DTOs
    // ==========================================

    public class ProjectSearchFilters
    {
        public string? Keyword { get; set; }
        public string? Type { get; set; }
        public string? LocationType { get; set; }
        public string? CompensationType { get; set; }
        public string? Status { get; set; }
        public List<int>? SkillIds { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}