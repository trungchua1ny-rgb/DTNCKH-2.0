namespace TimDongDoi.API.DTOs.Recommendation;

// ============================================
// RESPONSE DTOs
// ============================================

public class JobRecommendationDto
{
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogo { get; set; }
    public string? Location { get; set; }
    public string? Type { get; set; }
    public string? Level { get; set; }
    public int? SalaryMin { get; set; }
    public int? SalaryMax { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Matching info
    public double MatchScore { get; set; }
    public string MatchLevel { get; set; } = string.Empty; // Excellent, Good, Fair
    public List<string> MatchReasons { get; set; } = new();
    public List<MatchedSkillDto> MatchedSkills { get; set; } = new();
    public int TotalSkillsRequired { get; set; }
    public int MatchedSkillsCount { get; set; }
}

public class ProjectRecommendationDto
{
    public int ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public int OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string? OwnerAvatar { get; set; }
    public string Type { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public string CompensationType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    // Matching info
    public double MatchScore { get; set; }
    public string MatchLevel { get; set; } = string.Empty;
    public List<string> MatchReasons { get; set; } = new();
    public List<MatchedSkillDto> MatchedSkills { get; set; } = new();
    public int TotalPositions { get; set; }
    public int OpenPositions { get; set; }
}

public class CandidateRecommendationDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public string? JobTitle { get; set; }
    public string? Location { get; set; }
    public int? SalaryExpectation { get; set; }
    
    // Matching info for specific job/project
    public double MatchScore { get; set; }
    public string MatchLevel { get; set; } = string.Empty;
    public List<string> MatchReasons { get; set; } = new();
    public List<MatchedSkillDto> MatchedSkills { get; set; } = new();
    public int TotalSkillsRequired { get; set; }
    public int MatchedSkillsCount { get; set; }
    
    // User stats
    public double? AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int YearsOfExperience { get; set; }
}

public class MatchedSkillDto
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string? UserLevel { get; set; }
    public string? RequiredLevel { get; set; }
    public decimal? UserYearsExperience { get; set; }
    public bool IsRequired { get; set; }
    public bool IsMatched { get; set; }
}

public class RecommendationStatsDto
{
    public int TotalJobsRecommended { get; set; }
    public int ExcellentMatches { get; set; }
    public int GoodMatches { get; set; }
    public int FairMatches { get; set; }
    
    public List<string> TopMatchedSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public List<string> SuggestedSkillsToLearn { get; set; } = new();
}

// ============================================
// HELPER DTOs
// ============================================

public class SkillMatchResult
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public bool IsMatched { get; set; }
    public bool IsRequired { get; set; }
    public string? UserLevel { get; set; }
    public string? RequiredLevel { get; set; }
    public decimal? UserYearsExperience { get; set; }
    public double MatchWeight { get; set; }
}

public class MatchScoreBreakdown
{
    public double SkillScore { get; set; }
    public double LevelScore { get; set; }
    public double ExperienceScore { get; set; }
    public double LocationScore { get; set; }
    public double SalaryScore { get; set; }
    public double PopularityScore { get; set; }
    public double CollaborativeScore { get; set; }
    public double FinalScore { get; set; }
}