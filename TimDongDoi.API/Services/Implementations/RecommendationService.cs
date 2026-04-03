using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Recommendation;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations;

public class RecommendationService : IRecommendationService
{
    private readonly AppDbContext _context;

    public RecommendationService(AppDbContext context)
    {
        _context = context;
    }

    // ============================================
    // USER RECOMMENDATIONS
    // ============================================

    public async Task<List<JobRecommendationDto>> GetRecommendedJobsForUserAsync(int userId, int count = 20)
    {
        var userSkills = await _context.UserSkills
            .AsNoTracking()
            .Where(us => us.UserId == userId)
            .Include(us => us.Skill)
            .ToListAsync();

        if (!userSkills.Any())
            return new List<JobRecommendationDto>();

        var userSkillIds = userSkills.Select(us => us.SkillId).ToList();

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return new List<JobRecommendationDto>();

        var appliedJobIds = await _context.Applications
            .Where(a => a.UserId == userId)
            .Select(a => a.JobId)
            .ToListAsync();

        var jobs = await _context.Jobs
            .AsNoTracking()
            .Where(j => j.Status == "open" && !appliedJobIds.Contains(j.Id))
            .Include(j => j.Company)
            .Include(j => j.JobSkills)
            .ThenInclude(js => js.Skill)
            .OrderByDescending(j => j.CreatedAt)
            .Take(100)
            .ToListAsync();

        var recommendations = new List<JobRecommendationDto>();

        foreach (var job in jobs)
        {
            var score = await CalculateJobMatchScoreAsync(userId, job.Id);

            if (score >= 30)
            {
                var matchedSkills = await GetMatchedSkillsForJob(userId, job.Id);
                var matchReasons = GenerateMatchReasons(score, matchedSkills, user, job);

                recommendations.Add(new JobRecommendationDto
                {
                    JobId = job.Id,
                    JobTitle = job.Title,
                    CompanyId = job.CompanyId,
                    CompanyName = job.Company?.Name ?? "Unknown",
                    CompanyLogo = job.Company?.Logo,
                    Location = job.Location,
                    Type = job.Type,
                    Level = job.Level,
                    SalaryMin = job.SalaryMin,
                    SalaryMax = job.SalaryMax,
                    CreatedAt = job.CreatedAt ?? DateTime.Now,
                    MatchScore = Math.Round(score, 1),
                    MatchLevel = GetMatchLevel(score),
                    MatchReasons = matchReasons,
                    MatchedSkills = matchedSkills,
                    TotalSkillsRequired = job.JobSkills?.Count ?? 0,
                    MatchedSkillsCount = matchedSkills.Count(s => s.IsMatched)
                });
            }
        }

        return recommendations
            .OrderByDescending(r => r.MatchScore)
            .Take(count)
            .ToList();
    }

    public async Task<List<ProjectRecommendationDto>> GetRecommendedProjectsForUserAsync(int userId, int count = 20)
    {
        var userSkills = await _context.UserSkills
            .AsNoTracking()
            .Where(us => us.UserId == userId)
            .ToListAsync();

        if (!userSkills.Any())
            return new List<ProjectRecommendationDto>();

        var userSkillIds = userSkills.Select(us => us.SkillId).ToList();

        var appliedProjectIds = await _context.ProjectApplications
            .Where(pa => pa.UserId == userId)
            .Select(pa => pa.ProjectId)
            .ToListAsync();

        var projects = await _context.Projects
            .AsNoTracking()
            .Where(p => (p.Status == "open" || p.Status == "in_progress") && 
                       !appliedProjectIds.Contains(p.Id) &&
                       p.UserId != userId)
            .Include(p => p.User)
            .OrderByDescending(p => p.CreatedAt)
            .Take(100)
            .ToListAsync();

        var recommendations = new List<ProjectRecommendationDto>();

        foreach (var project in projects)
        {
            var score = await CalculateProjectMatchScoreAsync(userId, project.Id);

            if (score >= 30)
            {
                var matchedSkills = await GetMatchedSkillsForProject(userId, project.Id);
                var positions = await _context.ProjectPositions
                    .AsNoTracking()
                    .Where(pp => pp.ProjectId == project.Id)
                    .ToListAsync();

                recommendations.Add(new ProjectRecommendationDto
                {
                    ProjectId = project.Id,
                    ProjectTitle = project.Title,
                    OwnerId = project.UserId,
                    OwnerName = project.User?.FullName ?? "Unknown",
                    OwnerAvatar = project.User?.Avatar,
                    Type = project.Type,
                    LocationType = project.LocationType,
                    CompensationType = project.CompensationType,
                    CreatedAt = project.CreatedAt,
                    MatchScore = Math.Round(score, 1),
                    MatchLevel = GetMatchLevel(score),
                    MatchReasons = GenerateProjectMatchReasons(score, matchedSkills),
                    MatchedSkills = matchedSkills,
                    TotalPositions = positions.Sum(p => p.Quantity),
                    OpenPositions = positions.Where(p => p.Status == "open").Sum(p => p.Quantity)
                });
            }
        }

        return recommendations
            .OrderByDescending(r => r.MatchScore)
            .Take(count)
            .ToList();
    }

    public async Task<RecommendationStatsDto> GetRecommendationStatsForUserAsync(int userId)
    {
        var jobs = await GetRecommendedJobsForUserAsync(userId, 100);

        var stats = new RecommendationStatsDto
        {
            TotalJobsRecommended = jobs.Count,
            ExcellentMatches = jobs.Count(j => j.MatchScore >= 80),
            GoodMatches = jobs.Count(j => j.MatchScore >= 60 && j.MatchScore < 80),
            FairMatches = jobs.Count(j => j.MatchScore >= 40 && j.MatchScore < 60)
        };

        var skillCounts = new Dictionary<string, int>();
        foreach (var job in jobs)
        {
            foreach (var skill in job.MatchedSkills.Where(s => s.IsMatched))
            {
                if (!skillCounts.ContainsKey(skill.SkillName))
                    skillCounts[skill.SkillName] = 0;
                skillCounts[skill.SkillName]++;
            }
        }

        stats.TopMatchedSkills = skillCounts
            .OrderByDescending(kvp => kvp.Value)
            .Take(5)
            .Select(kvp => kvp.Key)
            .ToList();

        var missingSkillCounts = new Dictionary<string, int>();
        foreach (var job in jobs)
        {
            foreach (var skill in job.MatchedSkills.Where(s => !s.IsMatched && s.IsRequired))
            {
                if (!missingSkillCounts.ContainsKey(skill.SkillName))
                    missingSkillCounts[skill.SkillName] = 0;
                missingSkillCounts[skill.SkillName]++;
            }
        }

        stats.MissingSkills = missingSkillCounts
            .OrderByDescending(kvp => kvp.Value)
            .Take(5)
            .Select(kvp => kvp.Key)
            .ToList();

        stats.SuggestedSkillsToLearn = stats.MissingSkills;

        return stats;
    }

    // ============================================
    // COMPANY RECOMMENDATIONS
    // ============================================

    public async Task<List<CandidateRecommendationDto>> GetRecommendedCandidatesForJobAsync(int jobId, int count = 20)
    {
        var job = await _context.Jobs
            .AsNoTracking()
            .Include(j => j.JobSkills)
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == jobId);

        if (job == null)
            return new List<CandidateRecommendationDto>();

        var appliedUserIds = await _context.Applications
            .Where(a => a.JobId == jobId)
            .Select(a => a.UserId)
            .ToListAsync();

        var jobSkillIds = job.JobSkills?.Select(js => js.SkillId).ToList() ?? new List<int>();

        var candidateUserIds = await _context.UserSkills
            .Where(us => jobSkillIds.Contains(us.SkillId) && !appliedUserIds.Contains(us.UserId))
            .Select(us => us.UserId)
            .Distinct()
            .ToListAsync();

        var users = await _context.Users
            .AsNoTracking()
            .Where(u => candidateUserIds.Contains(u.Id) && u.Role == "user")
            .Take(100)
            .ToListAsync();

        var recommendations = new List<CandidateRecommendationDto>();

        foreach (var user in users)
        {
            var score = await CalculateJobMatchScoreAsync(user.Id, jobId);

            if (score >= 40)
            {
                var matchedSkills = await GetMatchedSkillsForJob(user.Id, jobId);
                
                var reviews = await _context.Reviews
                    .AsNoTracking()
                    .Where(r => r.ToUserId == user.Id && (r.IsVisible ?? false))
                    .ToListAsync();

                var avgRating = reviews.Any() ? (double?)reviews.Average(r => r.Rating) : null;

                var totalYears = await _context.UserSkills
              .Where(us => us.UserId == user.Id)
            .MaxAsync(us => us.YearsExperience) ?? 0m;

                recommendations.Add(new CandidateRecommendationDto
                {
                    UserId = user.Id,
                    UserName = user.FullName ?? "Unknown",
                    UserAvatar = user.Avatar,
                    JobTitle = user.JobTitle,
                    Location = user.Address,
                    SalaryExpectation = user.SalaryExpectation,
                    MatchScore = Math.Round(score, 1),
                    MatchLevel = GetMatchLevel(score),
                    MatchReasons = GenerateCandidateMatchReasons(score, matchedSkills),
                    MatchedSkills = matchedSkills,
                    TotalSkillsRequired = jobSkillIds.Count,
                    MatchedSkillsCount = matchedSkills.Count(s => s.IsMatched),
                    AverageRating = avgRating,
                    TotalReviews = reviews.Count,
                    YearsOfExperience = (int)totalYears
                });
            }
        }

        return recommendations
            .OrderByDescending(r => r.MatchScore)
            .Take(count)
            .ToList();
    }

    public async Task<List<CandidateRecommendationDto>> GetRecommendedCandidatesForProjectAsync(int projectId, int count = 20)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
            return new List<CandidateRecommendationDto>();

        var positionIds = await _context.ProjectPositions
            .Where(pp => pp.ProjectId == projectId)
            .Select(pp => pp.Id)
            .ToListAsync();

        var projectSkillIds = await _context.ProjectPositionSkills
            .Where(pps => positionIds.Contains(pps.PositionId))
            .Select(pps => pps.SkillId)
            .Distinct()
            .ToListAsync();

        if (!projectSkillIds.Any())
            return new List<CandidateRecommendationDto>();

        var appliedUserIds = await _context.ProjectApplications
            .Where(pa => pa.ProjectId == projectId)
            .Select(pa => pa.UserId)
            .ToListAsync();

        var candidateUserIds = await _context.UserSkills
            .Where(us => projectSkillIds.Contains(us.SkillId) && !appliedUserIds.Contains(us.UserId))
            .Select(us => us.UserId)
            .Distinct()
            .ToListAsync();

        var users = await _context.Users
            .AsNoTracking()
            .Where(u => candidateUserIds.Contains(u.Id) && u.Role == "user")
            .Take(100)
            .ToListAsync();

        var recommendations = new List<CandidateRecommendationDto>();

        foreach (var user in users)
        {
            var score = await CalculateProjectMatchScoreAsync(user.Id, projectId);

            if (score >= 40)
            {
                var matchedSkills = await GetMatchedSkillsForProject(user.Id, projectId);
                
                var reviews = await _context.Reviews
                    .AsNoTracking()
                    .Where(r => r.ToUserId == user.Id && (r.IsVisible ?? false))
                    .ToListAsync();

                var avgRating = reviews.Any() ? (double?)reviews.Average(r => r.Rating) : null;

              var totalYears = await _context.UserSkills
             .Where(us => us.UserId == user.Id)
             .MaxAsync(us => us.YearsExperience) ?? 0m;
                recommendations.Add(new CandidateRecommendationDto
                {
                    UserId = user.Id,
                    UserName = user.FullName ?? "Unknown",
                    UserAvatar = user.Avatar,
                    JobTitle = user.JobTitle,
                    Location = user.Address,
                    SalaryExpectation = user.SalaryExpectation,
                    MatchScore = Math.Round(score, 1),
                    MatchLevel = GetMatchLevel(score),
                    MatchReasons = GenerateCandidateMatchReasons(score, matchedSkills),
                    MatchedSkills = matchedSkills,
                    TotalSkillsRequired = projectSkillIds.Count,
                    MatchedSkillsCount = matchedSkills.Count(s => s.IsMatched),
                    AverageRating = avgRating,
                    TotalReviews = reviews.Count,
                    YearsOfExperience = (int)totalYears
                });
            }
        }

        return recommendations
            .OrderByDescending(r => r.MatchScore)
            .Take(count)
            .ToList();
    }

    // ============================================
    // MATCHING SCORES - CORE ALGORITHMS
    // ============================================

    public async Task<double> CalculateJobMatchScoreAsync(int userId, int jobId)
    {
        var breakdown = await GetMatchScoreBreakdownAsync(userId, jobId);
        return breakdown.FinalScore;
    }

    public async Task<double> CalculateProjectMatchScoreAsync(int userId, int projectId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        var project = await _context.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == projectId);

        if (user == null || project == null)
            return 0;

        var skillScore = await CalculateProjectSkillScore(userId, projectId);
        var locationScore = project.LocationType == "remote" ? 100 : 50;
        var popularityScore = CalculatePopularityScore(project.Views, 0);
        var compensationScore = 50;

        var finalScore = 
            (skillScore * 0.50) +
            (locationScore * 0.20) +
            (popularityScore * 0.15) +
            (compensationScore * 0.15);

        return Math.Min(finalScore, 100);
    }

    public async Task<MatchScoreBreakdown> GetMatchScoreBreakdownAsync(int userId, int jobId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        var job = await _context.Jobs
            .AsNoTracking()
            .Include(j => j.JobSkills)
            .FirstOrDefaultAsync(j => j.Id == jobId);

        if (user == null || job == null)
            return new MatchScoreBreakdown();

        var skillScore = await CalculateSkillScore(userId, jobId);
        var levelScore = CalculateLevelScore(user.JobTitle, job.Level);
        var experienceScore = await CalculateExperienceScore(userId, jobId);
        var locationScore = CalculateLocationScore(user.Address, job.Location, job.LocationType);
        var salaryScore = CalculateSalaryScore(user.SalaryExpectation, job.SalaryMin, job.SalaryMax);
        var applicationsCount = await _context.Applications.CountAsync(a => a.JobId == jobId);
        var popularityScore = CalculatePopularityScore(job.Views ?? 0, applicationsCount);

        var finalScore = 
            (skillScore * 0.40) +
            (levelScore * 0.20) +
            (experienceScore * 0.10) +
            (locationScore * 0.10) +
            (salaryScore * 0.10) +
            (popularityScore * 0.10);

        return new MatchScoreBreakdown
        {
            SkillScore = skillScore,
            LevelScore = levelScore,
            ExperienceScore = experienceScore,
            LocationScore = locationScore,
            SalaryScore = salaryScore,
            PopularityScore = popularityScore,
            FinalScore = Math.Min(finalScore, 100)
        };
    }

    // ============================================
    // SCORING ALGORITHMS
    // ============================================

    private async Task<double> CalculateSkillScore(int userId, int jobId)
    {
        var userSkillIds = await _context.UserSkills
            .Where(us => us.UserId == userId)
            .Select(us => us.SkillId)
            .ToListAsync();

        var jobSkills = await _context.JobSkills
            .AsNoTracking()
            .Where(js => js.JobId == jobId)
            .ToListAsync();

        if (!jobSkills.Any())
            return 50;

        var requiredSkills = jobSkills.Where(js => js.IsRequired == true).ToList();
        var optionalSkills = jobSkills.Where(js => js.IsRequired != true).ToList();

        var matchedRequired = requiredSkills.Count(rs => userSkillIds.Contains(rs.SkillId));
        var requiredScore = requiredSkills.Any() 
            ? (double)matchedRequired / requiredSkills.Count * 100 
            : 100;

        var matchedOptional = optionalSkills.Count(os => userSkillIds.Contains(os.SkillId));
        var optionalScore = optionalSkills.Any() 
            ? (double)matchedOptional / optionalSkills.Count * 100 
            : 100;

        var totalWeight = (requiredSkills.Count * 1.5) + optionalSkills.Count;
        var weightedScore = totalWeight > 0
            ? ((matchedRequired * 1.5 * 100) + (matchedOptional * 100)) / totalWeight
            : 50;

        return Math.Min(weightedScore, 100);
    }

    private async Task<double> CalculateProjectSkillScore(int userId, int projectId)
    {
        var userSkillIds = await _context.UserSkills
            .Where(us => us.UserId == userId)
            .Select(us => us.SkillId)
            .ToListAsync();

        var positionIds = await _context.ProjectPositions
            .Where(pp => pp.ProjectId == projectId)
            .Select(pp => pp.Id)
            .ToListAsync();

        var projectSkills = await _context.ProjectPositionSkills
            .AsNoTracking()
            .Where(pps => positionIds.Contains(pps.PositionId))
            .ToListAsync();

        if (!projectSkills.Any())
            return 50;

        var matchedSkills = projectSkills.Count(ps => userSkillIds.Contains(ps.SkillId));
        return (double)matchedSkills / projectSkills.Count * 100;
    }

    private double CalculateLevelScore(string? userLevel, string? jobLevel)
    {
        var levels = new Dictionary<string, int>
        {
            { "intern", 1 },
            { "junior", 2 },
            { "mid", 3 },
            { "senior", 4 },
            { "lead", 5 }
        };

        if (string.IsNullOrEmpty(userLevel) || string.IsNullOrEmpty(jobLevel))
            return 50;

        var userLvl = levels.GetValueOrDefault(userLevel.ToLower(), 3);
        var jobLvl = levels.GetValueOrDefault(jobLevel.ToLower(), 3);

        var gap = Math.Abs(userLvl - jobLvl);

        return gap switch
        {
            0 => 100,
            1 => 70,
            2 => 40,
            _ => 20
        };
    }

    private async Task<double> CalculateExperienceScore(int userId, int jobId)
    {
        var maxYears = await _context.UserSkills
    .Where(us => us.UserId == userId)
    .MaxAsync(us => us.YearsExperience) ?? 0m; 
// Lấy Max dưới SQL, nếu không có record nào (null) thì C# sẽ tự gán bằng 0m

        var job = await _context.Jobs.AsNoTracking().FirstOrDefaultAsync(j => j.Id == jobId);
        if (job == null)
            return 50;

        var requiredYears = job.Level?.ToLower() switch
        {
            "intern" => 0,
            "junior" => 1,
            "mid" => 3,
            "senior" => 5,
            "lead" => 7,
            _ => 2
        };

        if (maxYears >= requiredYears)
            return 100;
        
        if (maxYears >= requiredYears * 0.7m)
            return 70;

        return 40;
    }

    private double CalculateLocationScore(string? userLocation, string? jobLocation, string? locationType)
    {
        if (locationType?.ToLower() == "remote")
            return 100;

        if (string.IsNullOrEmpty(userLocation) || string.IsNullOrEmpty(jobLocation))
            return 50;

        if (userLocation.Contains(jobLocation, StringComparison.OrdinalIgnoreCase) ||
            jobLocation.Contains(userLocation, StringComparison.OrdinalIgnoreCase))
            return 100;

        if (locationType?.ToLower() == "hybrid")
            return 60;

        return 30;
    }

    private double CalculateSalaryScore(int? userExpectation, int? jobMin, int? jobMax)
    {
        if (!userExpectation.HasValue || !jobMin.HasValue)
            return 50;

        if (userExpectation <= jobMax)
            return 100;

        if (userExpectation <= jobMin * 1.2)
            return 70;

        return 30;
    }

    private double CalculatePopularityScore(int views, int applications)
    {
        var score = (views * 0.3 + applications * 0.7);
        return Math.Min(score / 50 * 100, 100);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private string GetMatchLevel(double score)
    {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Poor";
    }

    private List<string> GenerateMatchReasons(double score, List<MatchedSkillDto> matchedSkills, Models.User user, Models.Job job)
    {
        var reasons = new List<string>();

        var matchedCount = matchedSkills.Count(s => s.IsMatched);
        var totalRequired = matchedSkills.Count(s => s.IsRequired);

        if (matchedCount >= totalRequired * 0.8)
            reasons.Add($"Bạn có {matchedCount}/{totalRequired} kỹ năng yêu cầu");

        if (matchedSkills.Any(s => s.IsMatched && s.IsRequired))
        {
            var topSkills = matchedSkills
                .Where(s => s.IsMatched && s.IsRequired)
                .Take(3)
                .Select(s => s.SkillName);
            reasons.Add($"Phù hợp về: {string.Join(", ", topSkills)}");
        }

        return reasons;
    }

    private List<string> GenerateProjectMatchReasons(double score, List<MatchedSkillDto> matchedSkills)
    {
        var reasons = new List<string>();
        var matchedCount = matchedSkills.Count(s => s.IsMatched);
        
        if (matchedCount > 0)
            reasons.Add($"Có {matchedCount} kỹ năng phù hợp");

        return reasons;
    }

    private List<string> GenerateCandidateMatchReasons(double score, List<MatchedSkillDto> matchedSkills)
    {
        var reasons = new List<string>();
        var matchedCount = matchedSkills.Count(s => s.IsMatched);
        
        if (matchedCount > 0)
            reasons.Add($"Ứng viên có {matchedCount} kỹ năng yêu cầu");

        return reasons;
    }

    private async Task<List<MatchedSkillDto>> GetMatchedSkillsForJob(int userId, int jobId)
    {
        var userSkills = await _context.UserSkills
            .AsNoTracking()
            .Where(us => us.UserId == userId)
            .Include(us => us.Skill)
            .ToListAsync();

        var jobSkills = await _context.JobSkills
            .AsNoTracking()
            .Where(js => js.JobId == jobId)
            .Include(js => js.Skill)
            .ToListAsync();

        var result = new List<MatchedSkillDto>();

        foreach (var jobSkill in jobSkills)
        {
            var userSkill = userSkills.FirstOrDefault(us => us.SkillId == jobSkill.SkillId);
            var isMatched = userSkill != null;

            result.Add(new MatchedSkillDto
            {
                SkillId = jobSkill.SkillId,
                SkillName = jobSkill.Skill?.Name ?? "Unknown",
                UserLevel = userSkill?.Level,
                RequiredLevel = jobSkill.Level,
                UserYearsExperience = userSkill?.YearsExperience,
                IsRequired = jobSkill.IsRequired == true,
                IsMatched = isMatched
            });
        }

        return result;
    }

    private async Task<List<MatchedSkillDto>> GetMatchedSkillsForProject(int userId, int projectId)
    {
        var userSkills = await _context.UserSkills
            .AsNoTracking()
            .Where(us => us.UserId == userId)
            .Include(us => us.Skill)
            .ToListAsync();

        var positionIds = await _context.ProjectPositions
            .Where(pp => pp.ProjectId == projectId)
            .Select(pp => pp.Id)
            .ToListAsync();

        var projectSkills = await _context.ProjectPositionSkills
            .AsNoTracking()
            .Where(pps => positionIds.Contains(pps.PositionId))
            .Include(pps => pps.Skill)
            .ToListAsync();

        var result = new List<MatchedSkillDto>();

        foreach (var projectSkill in projectSkills)
        {
            var userSkill = userSkills.FirstOrDefault(us => us.SkillId == projectSkill.SkillId);
            var isMatched = userSkill != null;

            result.Add(new MatchedSkillDto
            {
                SkillId = projectSkill.SkillId,
                SkillName = projectSkill.Skill?.Name ?? "Unknown",
                UserLevel = userSkill?.Level,
                RequiredLevel = null,
                UserYearsExperience = userSkill?.YearsExperience,
                IsRequired = projectSkill.IsRequired == true,
                IsMatched = isMatched
            });
        }

        return result;
    }
}