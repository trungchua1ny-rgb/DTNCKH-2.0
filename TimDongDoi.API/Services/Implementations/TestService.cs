using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Notification;
using TimDongDoi.API.DTOs.Test;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations;

public class TestService : ITestService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public TestService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    // ==================== HELPER ====================

    private async Task<Company> GetCompanyByUserId(int userId)
    {
        return await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new UnauthorizedAccessException("Company profile not found");
    }

    private async Task<Test> GetTestAndVerifyOwner(int companyUserId, int testId)
    {
        var company = await GetCompanyByUserId(companyUserId);
        var test = await _context.Tests.FirstOrDefaultAsync(t => t.Id == testId)
            ?? throw new KeyNotFoundException("Test not found");
        if (test.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this test");
        return test;
    }

    private static TestDto MapTestToDto(Test t) => new()
    {
        Id              = t.Id,
        CompanyId       = t.CompanyId,
        Title           = t.Title,
        Description     = t.Description,
        DurationMinutes = t.DurationMinutes,
        PassingScore    = t.PassingScore,
        Status          = t.Status,
        TotalQuestions  = t.TestQuestions.Count,
        TotalPoints     = t.TestQuestions.Sum(q => q.Points ?? 1),
        CreatedAt       = t.CreatedAt ?? DateTime.UtcNow
    };

    // ==================== TEST CRUD ====================

    public async Task<TestListResponse> GetMyTests(int companyUserId, int page, int pageSize)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var query = _context.Tests
            .Include(t => t.TestQuestions)
            .Where(t => t.CompanyId == company.Id);

        var totalCount = await query.CountAsync();
        var tests = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new TestListResponse
        {
            Tests      = tests.Select(MapTestToDto).ToList(),
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize
        };
    }

    public async Task<TestDto> GetTestById(int companyUserId, int testId)
    {
        var test = await GetTestAndVerifyOwner(companyUserId, testId);
        await _context.Entry(test).Collection(t => t.TestQuestions).LoadAsync();
        return MapTestToDto(test);
    }

    public async Task<TestDto> CreateTest(int companyUserId, CreateTestRequest request)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var test = new Test
        {
            CompanyId       = company.Id,
            Title           = request.Title,
            Description     = request.Description,
            DurationMinutes = request.DurationMinutes,
            PassingScore    = request.PassingScore,
            Status          = "draft",
            CreatedAt       = DateTime.UtcNow,
            UpdatedAt       = DateTime.UtcNow
        };

        _context.Tests.Add(test);
        await _context.SaveChangesAsync();
        await _context.Entry(test).Collection(t => t.TestQuestions).LoadAsync();
        return MapTestToDto(test);
    }

    public async Task<TestDto> UpdateTest(int companyUserId, int testId, UpdateTestRequest request)
    {
        var test = await GetTestAndVerifyOwner(companyUserId, testId);

        if (request.Title != null) test.Title = request.Title;
        if (request.Description != null) test.Description = request.Description;
        if (request.DurationMinutes.HasValue) test.DurationMinutes = request.DurationMinutes;
        if (request.PassingScore.HasValue) test.PassingScore = request.PassingScore;
        if (request.Status != null)
        {
            var validStatuses = new[] { "draft", "active", "inactive" };
            if (!validStatuses.Contains(request.Status))
                throw new InvalidOperationException("Status must be: draft, active, inactive");
            test.Status = request.Status;
        }
        test.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _context.Entry(test).Collection(t => t.TestQuestions).LoadAsync();
        return MapTestToDto(test);
    }

    public async Task DeleteTest(int companyUserId, int testId)
    {
        var test = await GetTestAndVerifyOwner(companyUserId, testId);

        var hasResults = await _context.ApplicationTests.AnyAsync(at => at.TestId == testId);
        if (hasResults)
            throw new InvalidOperationException("Cannot delete test that has been taken by candidates");

        _context.Tests.Remove(test);
        await _context.SaveChangesAsync();
    }

    // ==================== TEST QUESTIONS ====================

    public async Task<List<TestQuestionDto>> GetQuestions(int companyUserId, int testId)
    {
        var test = await GetTestAndVerifyOwner(companyUserId, testId);

        return await _context.TestQuestions
            .Where(q => q.TestId == testId)
            .OrderBy(q => q.OrderNum)
            .Select(q => new TestQuestionDto
            {
                Id            = q.Id,
                TestId        = q.TestId,
                Question      = q.Question,
                Type          = q.Type,
                Options       = q.Options,
                CorrectAnswer = q.CorrectAnswer,
                Points        = q.Points ?? 1,
                OrderNum      = q.OrderNum ?? 0
            })
            .ToListAsync();
    }

    public async Task<TestQuestionDto> AddQuestion(int companyUserId, int testId, CreateTestQuestionRequest request)
    {
        var test = await GetTestAndVerifyOwner(companyUserId, testId);

        var validTypes = new[] { "multiple_choice", "essay", "coding" };
        if (!validTypes.Contains(request.Type))
            throw new InvalidOperationException("Type must be: multiple_choice, essay, coding");

        var question = new TestQuestion
        {
            TestId        = testId,
            Question      = request.Question,
            Type          = request.Type,
            Options       = request.Options,
            CorrectAnswer = request.CorrectAnswer,
            Points        = request.Points,
            OrderNum      = request.OrderNum
        };

        _context.TestQuestions.Add(question);
        await _context.SaveChangesAsync();

        return new TestQuestionDto
        {
            Id            = question.Id,
            TestId        = question.TestId,
            Question      = question.Question,
            Type          = question.Type,
            Options       = question.Options,
            CorrectAnswer = question.CorrectAnswer,
            Points        = question.Points ?? 1,
            OrderNum      = question.OrderNum ?? 0
        };
    }

    public async Task<TestQuestionDto> UpdateQuestion(
        int companyUserId, int testId, int questionId, UpdateTestQuestionRequest request)
    {
        await GetTestAndVerifyOwner(companyUserId, testId);

        var question = await _context.TestQuestions
            .FirstOrDefaultAsync(q => q.Id == questionId && q.TestId == testId)
            ?? throw new KeyNotFoundException("Question not found");

        if (request.Question != null) question.Question = request.Question;
        if (request.Type != null) question.Type = request.Type;
        if (request.Options != null) question.Options = request.Options;
        if (request.CorrectAnswer != null) question.CorrectAnswer = request.CorrectAnswer;
        if (request.Points.HasValue) question.Points = request.Points;
        if (request.OrderNum.HasValue) question.OrderNum = request.OrderNum;

        await _context.SaveChangesAsync();

        return new TestQuestionDto
        {
            Id            = question.Id,
            TestId        = question.TestId,
            Question      = question.Question,
            Type          = question.Type,
            Options       = question.Options,
            CorrectAnswer = question.CorrectAnswer,
            Points        = question.Points ?? 1,
            OrderNum      = question.OrderNum ?? 0
        };
    }

    public async Task DeleteQuestion(int companyUserId, int testId, int questionId)
    {
        await GetTestAndVerifyOwner(companyUserId, testId);

        var question = await _context.TestQuestions
            .FirstOrDefaultAsync(q => q.Id == questionId && q.TestId == testId)
            ?? throw new KeyNotFoundException("Question not found");

        _context.TestQuestions.Remove(question);
        await _context.SaveChangesAsync();
    }

    // ==================== ASSIGN TEST TO JOB ====================

    public async Task<JobTestDto> AssignTestToJob(int companyUserId, int jobId, AssignTestToJobRequest request)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId)
            ?? throw new KeyNotFoundException("Job not found");
        if (job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this job");

        var test = await _context.Tests.FirstOrDefaultAsync(t => t.Id == request.TestId)
            ?? throw new KeyNotFoundException("Test not found");
        if (test.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this test");

        var alreadyAssigned = await _context.JobTests
            .AnyAsync(jt => jt.JobId == jobId && jt.TestId == request.TestId);
        if (alreadyAssigned)
            throw new InvalidOperationException("Test already assigned to this job");

        var jobTest = new JobTest
        {
            JobId      = jobId,
            TestId     = request.TestId,
            IsRequired = request.IsRequired
        };

        _context.JobTests.Add(jobTest);
        await _context.SaveChangesAsync();

        return new JobTestDto
        {
            Id              = jobTest.Id,
            JobId           = jobTest.JobId,
            TestId          = jobTest.TestId,
            TestTitle       = test.Title,
            DurationMinutes = test.DurationMinutes,
            PassingScore    = test.PassingScore,
            IsRequired      = jobTest.IsRequired ?? false
        };
    }

    public async Task<List<JobTestDto>> GetJobTests(int jobId)
    {
        return await _context.JobTests
            .Where(jt => jt.JobId == jobId)
            .Include(jt => jt.Test)
            .Select(jt => new JobTestDto
            {
                Id              = jt.Id,
                JobId           = jt.JobId,
                TestId          = jt.TestId,
                TestTitle       = jt.Test.Title,
                DurationMinutes = jt.Test.DurationMinutes,
                PassingScore    = jt.Test.PassingScore,
                IsRequired      = jt.IsRequired ?? false
            })
            .ToListAsync();
    }

    public async Task RemoveTestFromJob(int companyUserId, int jobId, int jobTestId)
    {
        var company = await GetCompanyByUserId(companyUserId);
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId)
            ?? throw new KeyNotFoundException("Job not found");
        if (job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this job");

        var jobTest = await _context.JobTests
            .FirstOrDefaultAsync(jt => jt.Id == jobTestId && jt.JobId == jobId)
            ?? throw new KeyNotFoundException("JobTest not found");

        _context.JobTests.Remove(jobTest);
        await _context.SaveChangesAsync();
    }

    // ==================== CANDIDATE LÀM TEST ====================

    public async Task<List<ApplicationTestDto>> GetMyApplicationTests(int userId, int applicationId)
    {
        var application = await _context.Applications
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId)
            ?? throw new KeyNotFoundException("Application not found");

        return await _context.ApplicationTests
            .Where(at => at.ApplicationId == applicationId)
            .Include(at => at.Test)
            .Select(at => new ApplicationTestDto
            {
                Id              = at.Id,
                ApplicationId   = at.ApplicationId,
                TestId          = at.TestId,
                TestTitle       = at.Test.Title,
                DurationMinutes = at.Test.DurationMinutes,
                PassingScore    = at.Test.PassingScore,
                Status          = at.Status,
                Score           = at.Score,
                Passed          = at.Score.HasValue && at.Test.PassingScore.HasValue
                                    ? at.Score >= at.Test.PassingScore
                                    : null,
                StartedAt       = at.StartedAt,
                CompletedAt     = at.CompletedAt
            })
            .ToListAsync();
    }

    public async Task<StartTestResponse> StartTest(int userId, int applicationTestId)
    {
        var appTest = await _context.ApplicationTests
            .Include(at => at.Application)
            .Include(at => at.Test)
                .ThenInclude(t => t.TestQuestions)
            .FirstOrDefaultAsync(at => at.Id == applicationTestId)
            ?? throw new KeyNotFoundException("Test not found");

        if (appTest.Application.UserId != userId)
            throw new UnauthorizedAccessException("This test is not assigned to you");

        if (appTest.Status == "completed")
            throw new InvalidOperationException("Test already completed");

        // Bắt đầu test
        if (appTest.Status != "in_progress")
        {
            appTest.Status    = "in_progress";
            appTest.StartedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        var questions = appTest.Test.TestQuestions
            .OrderBy(q => q.OrderNum)
            .Select(q => new TestQuestionForCandidateDto
            {
                Id       = q.Id,
                Question = q.Question,
                Type     = q.Type,
                Options  = q.Options,
                Points   = q.Points ?? 1,
                OrderNum = q.OrderNum ?? 0
            })
            .ToList();

        return new StartTestResponse
        {
            ApplicationTestId = appTest.Id,
            TestTitle         = appTest.Test.Title,
            DurationMinutes   = appTest.Test.DurationMinutes,
            TotalQuestions    = questions.Count,
            TotalPoints       = questions.Sum(q => q.Points),
            Questions         = questions,
            StartedAt         = appTest.StartedAt ?? DateTime.UtcNow
        };
    }

    public async Task<SubmitTestResponse> SubmitTest(
        int userId, int applicationTestId, SubmitTestRequest request)
    {
        var appTest = await _context.ApplicationTests
            .Include(at => at.Application)
            .Include(at => at.Test)
                .ThenInclude(t => t.TestQuestions)
            .FirstOrDefaultAsync(at => at.Id == applicationTestId)
            ?? throw new KeyNotFoundException("Test not found");

        if (appTest.Application.UserId != userId)
            throw new UnauthorizedAccessException("This test is not assigned to you");

        if (appTest.Status == "completed")
            throw new InvalidOperationException("Test already completed");

        if (appTest.Status != "in_progress")
            throw new InvalidOperationException("Test has not been started yet");

        int score = 0;
        int totalPoints = appTest.Test.TestQuestions.Sum(q => q.Points ?? 1);

        try
        {
            var answers = JsonSerializer.Deserialize<Dictionary<string, string>>(request.Answers)
                ?? new Dictionary<string, string>();

            foreach (var question in appTest.Test.TestQuestions)
            {
                if (question.Type == "multiple_choice" && question.CorrectAnswer != null)
                {
                    if (answers.TryGetValue(question.Id.ToString(), out var answer))
                    {
                        if (answer.Trim().Equals(question.CorrectAnswer.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                        {
                            score += question.Points ?? 1;
                        }
                    }
                }
                else if (question.Type != "multiple_choice")
                {
                    score += question.Points ?? 1;
                }
            }
        }
        catch
        {
            throw new InvalidOperationException("Invalid answers format. Expected JSON object.");
        }

        appTest.Answers     = request.Answers;
        appTest.Score       = score;
        appTest.Status      = "completed";
        appTest.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        bool passed = appTest.Test.PassingScore.HasValue
            ? score >= appTest.Test.PassingScore.Value
            : true;

        return new SubmitTestResponse
        {
            Score        = score,
            TotalPoints  = totalPoints,
            PassingScore = appTest.Test.PassingScore,
            Passed       = passed,
            CompletedAt  = appTest.CompletedAt ?? DateTime.UtcNow
        };
    }

    public async Task<List<ApplicationTestDto>> GetApplicationTestResults(
        int companyUserId, int applicationId)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var application = await _context.Applications
            .Include(a => a.Job)
            .FirstOrDefaultAsync(a => a.Id == applicationId)
            ?? throw new KeyNotFoundException("Application not found");

        if (application.Job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this job");

        return await _context.ApplicationTests
            .Where(at => at.ApplicationId == applicationId)
            .Include(at => at.Test)
            .Select(at => new ApplicationTestDto
            {
                Id              = at.Id,
                ApplicationId   = at.ApplicationId,
                TestId          = at.TestId,
                TestTitle       = at.Test.Title,
                DurationMinutes = at.Test.DurationMinutes,
                PassingScore    = at.Test.PassingScore,
                Status          = at.Status,
                Score           = at.Score,
                Passed          = at.Score.HasValue && at.Test.PassingScore.HasValue
                                    ? at.Score >= at.Test.PassingScore
                                    : null,
                StartedAt       = at.StartedAt,
                CompletedAt     = at.CompletedAt
            })
            .ToListAsync();
    }

    public async Task<ApplicationTestDetailDto> GetApplicationTestDetail(
    int companyUserId, int applicationTestId)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var appTest = await _context.ApplicationTests
            .Include(at => at.Application)
                .ThenInclude(a => a.Job)
            .Include(at => at.Test)
                .ThenInclude(t => t.TestQuestions)
            .FirstOrDefaultAsync(at => at.Id == applicationTestId)
            ?? throw new KeyNotFoundException("ApplicationTest not found");

        if (appTest.Application.Job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this test");

        Dictionary<string, string> answers = new();
        if (!string.IsNullOrEmpty(appTest.Answers))
        {
            try { answers = JsonSerializer.Deserialize<Dictionary<string, string>>(appTest.Answers) ?? new(); }
            catch { }
        }

        Dictionary<string, int> manualScores = new();
        Dictionary<string, string> feedbacks = new();
        if (!string.IsNullOrEmpty(appTest.ManualScores))
        {
            try {
                var ms = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(appTest.ManualScores) ?? new();
                foreach (var kv in ms)
                {
                    if (kv.Value.TryGetProperty("score", out var s)) manualScores[kv.Key] = s.GetInt32();
                    if (kv.Value.TryGetProperty("feedback", out var f)) feedbacks[kv.Key] = f.GetString() ?? "";
                }
            }
            catch { }
        }

        var questions = appTest.Test.TestQuestions
            .OrderBy(q => q.OrderNum)
            .Select(q => new QuestionWithAnswerDto
            {
                Id            = q.Id,
                Question      = q.Question,
                Type          = q.Type,
                Options       = q.Options,
                CorrectAnswer = q.Type == "multiple_choice" ? q.CorrectAnswer : null,
                UserAnswer    = answers.GetValueOrDefault(q.Id.ToString(), ""),
                Points        = q.Points ?? 1,
                OrderNum      = q.OrderNum ?? 0,
                IsAutoGraded  = q.Type == "multiple_choice",
                ManualScore   = manualScores.TryGetValue(q.Id.ToString(), out var msScore) ? msScore : null,
                Feedback      = feedbacks.GetValueOrDefault(q.Id.ToString(), ""),
            })
            .ToList();

        return new ApplicationTestDetailDto
        {
            Id            = appTest.Id,
            ApplicationId = appTest.ApplicationId,
            TestTitle     = appTest.Test.Title,
            Score         = appTest.Score,
            PassingScore  = appTest.Test.PassingScore,
            Passed        = appTest.Score.HasValue && appTest.Test.PassingScore.HasValue
                            ? appTest.Score >= appTest.Test.PassingScore : null,
            Status        = appTest.Status,
            StartedAt     = appTest.StartedAt,
            CompletedAt   = appTest.CompletedAt,
            Questions     = questions,
        };
    }

    public async Task<ApplicationTestDto> ScoreManually(
        int companyUserId, int applicationTestId, ManualScoreRequest request)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var appTest = await _context.ApplicationTests
            .Include(at => at.Application)
                .ThenInclude(a => a.Job)
            .Include(at => at.Test)
                .ThenInclude(t => t.TestQuestions)
            .FirstOrDefaultAsync(at => at.Id == applicationTestId)
            ?? throw new KeyNotFoundException("ApplicationTest not found");

        if (appTest.Application.Job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this test");

        if (appTest.Status != "completed")
            throw new InvalidOperationException("Test has not been completed yet");

        var manualScoresDict = new Dictionary<string, object>();
        foreach (var qs in request.Scores ?? new List<QuestionScore>())
        {
            var question = appTest.Test.TestQuestions
                .FirstOrDefault(q => q.Id == qs.QuestionId)
                ?? throw new KeyNotFoundException($"Question {qs.QuestionId} not found");

            if (qs.Score < 0 || qs.Score > (question.Points ?? 1))
                throw new InvalidOperationException(
                    $"Score for question {qs.QuestionId} must be between 0 and {question.Points ?? 1}");

            manualScoresDict[qs.QuestionId.ToString()] = new { score = qs.Score, feedback = qs.Feedback ?? "" };
        }

        Dictionary<string, string> answers = new();
        if (!string.IsNullOrEmpty(appTest.Answers))
        {
            try { answers = JsonSerializer.Deserialize<Dictionary<string, string>>(appTest.Answers) ?? new(); }
            catch { }
        }

        int totalScore = 0;
        foreach (var q in appTest.Test.TestQuestions)
        {
            if (q.Type == "multiple_choice")
            {
                if (answers.TryGetValue(q.Id.ToString(), out var ans))
                    if (ans.Trim().Equals(q.CorrectAnswer?.Trim(), StringComparison.OrdinalIgnoreCase))
                        totalScore += q.Points ?? 1;
            }
            else
            {
                var scored = request.Scores?.FirstOrDefault(s => s.QuestionId == q.Id);
                totalScore += scored?.Score ?? 0;
            }
        }

        appTest.Score        = totalScore;
        appTest.ManualScores = JsonSerializer.Serialize(manualScoresDict);

        await _context.SaveChangesAsync();

        // ✅ THÔNG BÁO CHO ỨNG VIÊN: NTD vừa chấm điểm bài test
        await _notificationService.CreateNotification(new CreateNotificationRequest
        {
            UserId = appTest.Application.UserId,
            Type = "test_scored",
            Title = "Đã có kết quả bài kiểm tra 📝",
            Content = $"Nhà tuyển dụng đã chấm điểm bài thi '{appTest.Test.Title}' của bạn. Tổng điểm: {totalScore}.",
            Data = $"{{\"applicationId\": {appTest.ApplicationId}, \"testId\": {appTest.TestId}}}"
        });

        return new ApplicationTestDto
        {
            Id              = appTest.Id,
            ApplicationId   = appTest.ApplicationId,
            TestId          = appTest.TestId,
            TestTitle       = appTest.Test.Title,
            DurationMinutes = appTest.Test.DurationMinutes,
            PassingScore    = appTest.Test.PassingScore,
            Status          = appTest.Status,
            Score           = appTest.Score,
            Passed          = appTest.Score.HasValue && appTest.Test.PassingScore.HasValue
                              ? appTest.Score >= appTest.Test.PassingScore : null,
            StartedAt       = appTest.StartedAt,
            CompletedAt     = appTest.CompletedAt,
        };
    }

    // ==================== INTERVIEW ====================

    public async Task<InterviewListResponse> GetInterviews(
        int companyUserId, int page, int pageSize, string? status)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var jobIds = await _context.Jobs
            .Where(j => j.CompanyId == company.Id)
            .Select(j => j.Id)
            .ToListAsync();

        var applicationIds = await _context.Applications
            .Where(a => jobIds.Contains(a.JobId))
            .Select(a => a.Id)
            .ToListAsync();

        var query = _context.Interviews
            .Where(i => applicationIds.Contains(i.ApplicationId));

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        var totalCount = await query.CountAsync();

        var interviews = await query
            .OrderByDescending(i => i.ScheduledAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .Include(i => i.Application)
                .ThenInclude(a => a.User)
            .Select(i => new InterviewDto
            {
                Id              = i.Id,
                ApplicationId   = i.ApplicationId,
                JobTitle        = i.Application.Job.Title,
                CandidateName   = i.Application.User.FullName,
                Title           = i.Title,
                Description     = i.Description,
                ScheduledAt     = i.ScheduledAt,
                DurationMinutes = i.DurationMinutes,
                MeetingLink     = i.MeetingLink,
                Status          = i.Status,
                Feedback        = i.Feedback,
                CreatedAt       = i.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();

        return new InterviewListResponse
        {
            Interviews = interviews,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize
        };
    }

    public async Task<InterviewDto> GetInterviewById(int companyUserId, int interviewId)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var interview = await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .Include(i => i.Application)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(i => i.Id == interviewId)
            ?? throw new KeyNotFoundException("Interview not found");

        if (interview.Application.Job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this interview");

        return MapInterviewToDto(interview);
    }

    public async Task<InterviewDto> CreateInterview(int companyUserId, CreateInterviewRequest request)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var application = await _context.Applications
            .Include(a => a.Job)
            .Include(a => a.User) 
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId)
            ?? throw new KeyNotFoundException("Application not found");

        if (application.Job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this job");

        if (request.ScheduledAt <= DateTime.UtcNow)
            throw new InvalidOperationException("ScheduledAt must be in the future");

        var interview = new Interview
        {
            ApplicationId   = request.ApplicationId,
            Title           = request.Title,
            Description     = request.Description,
            ScheduledAt     = request.ScheduledAt,
            DurationMinutes = request.DurationMinutes,
            MeetingLink     = request.MeetingLink,
            Status          = "scheduled",
            CreatedAt       = DateTime.UtcNow,
            UpdatedAt       = DateTime.UtcNow
        };

        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

        // ✅ THÔNG BÁO CHO ỨNG VIÊN: NTD vừa tạo lịch phỏng vấn
        await _notificationService.CreateNotification(new CreateNotificationRequest
        {
            UserId = application.UserId,
            Type = "interview_scheduled",
            Title = "Lịch phỏng vấn mới 🗓️",
            Content = $"Nhà tuyển dụng đã lên lịch phỏng vấn cho vị trí '{application.Job.Title}' vào lúc {request.ScheduledAt:HH:mm dd/MM/yyyy}.",
            Data = $"{{\"interviewId\": {interview.Id}, \"applicationId\": {application.Id}}}"
        });

        await _context.Entry(interview).Reference(i => i.Application).LoadAsync();
        return MapInterviewToDto(interview);
    }

    public async Task<InterviewDto> UpdateInterview(
        int companyUserId, int interviewId, UpdateInterviewRequest request)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var interview = await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .Include(i => i.Application)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(i => i.Id == interviewId)
            ?? throw new KeyNotFoundException("Interview not found");

        if (interview.Application.Job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this interview");

        if (interview.Status == "completed" || interview.Status == "cancelled")
            throw new InvalidOperationException("Cannot update a completed or cancelled interview");

        if (request.Title != null) interview.Title = request.Title;
        if (request.Description != null) interview.Description = request.Description;
        if (request.ScheduledAt.HasValue)
        {
            if (request.ScheduledAt <= DateTime.UtcNow)
                throw new InvalidOperationException("ScheduledAt must be in the future");
            interview.ScheduledAt = request.ScheduledAt.Value;
        }
        if (request.DurationMinutes.HasValue) interview.DurationMinutes = request.DurationMinutes;
        if (request.MeetingLink != null) interview.MeetingLink = request.MeetingLink;
        
        bool isCancelled = false;
        if (request.Status != null)
        {
            var validStatuses = new[] { "scheduled", "completed", "cancelled" };
            if (!validStatuses.Contains(request.Status))
                throw new InvalidOperationException("Status must be: scheduled, completed, cancelled");
            
            if (request.Status == "cancelled" && interview.Status != "cancelled")
                isCancelled = true;

            interview.Status = request.Status;
        }
        interview.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // ✅ THÔNG BÁO CHO ỨNG VIÊN: NTD vừa cập nhật/hủy lịch
        string notifyTitle = isCancelled ? "Lịch phỏng vấn đã bị hủy ❌" : "Cập nhật lịch phỏng vấn 🔄";
        string notifyContent = isCancelled 
            ? $"Lịch phỏng vấn cho vị trí '{interview.Application.Job.Title}' đã bị hủy bởi nhà tuyển dụng."
            : $"Nhà tuyển dụng vừa thay đổi thông tin lịch phỏng vấn vị trí '{interview.Application.Job.Title}'. Hãy kiểm tra lại lịch trình của bạn.";

        await _notificationService.CreateNotification(new CreateNotificationRequest
        {
            UserId = interview.Application.UserId,
            Type = isCancelled ? "interview_cancelled" : "interview_updated",
            Title = notifyTitle,
            Content = notifyContent,
            Data = $"{{\"interviewId\": {interview.Id}, \"applicationId\": {interview.ApplicationId}}}"
        });

        return MapInterviewToDto(interview);
    }

    public async Task<InterviewDto> SubmitFeedback(
        int companyUserId, int interviewId, SubmitInterviewFeedbackRequest request)
    {
        var company = await GetCompanyByUserId(companyUserId);

        var interview = await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .Include(i => i.Application)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(i => i.Id == interviewId)
            ?? throw new KeyNotFoundException("Interview not found");

        if (interview.Application.Job.CompanyId != company.Id)
            throw new UnauthorizedAccessException("You don't own this interview");

        var validStatuses = new[] { "completed", "cancelled" };
        if (!validStatuses.Contains(request.Status))
            throw new InvalidOperationException("Status must be: completed or cancelled");

        interview.Feedback  = request.Feedback;
        interview.Status    = request.Status;
        interview.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // ✅ THÔNG BÁO CHO ỨNG VIÊN: Đã có đánh giá/feedback phỏng vấn
        if (request.Status == "completed") 
        {
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = interview.Application.UserId,
                Type = "interview_completed",
                Title = "Đã có đánh giá phỏng vấn 💬",
                Content = $"Nhà tuyển dụng đã gửi phản hồi cho buổi phỏng vấn vị trí '{interview.Application.Job.Title}'.",
                Data = $"{{\"interviewId\": {interview.Id}, \"applicationId\": {interview.ApplicationId}}}"
            });
        }

        return MapInterviewToDto(interview);
    }

    public async Task<List<InterviewDto>> GetMyInterviews(int userId)
    {
        return await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
            .Include(i => i.Application)
                .ThenInclude(a => a.User)
            .Where(i => i.Application.UserId == userId)
            .OrderByDescending(i => i.ScheduledAt)
            .Select(i => new InterviewDto
            {
                Id              = i.Id,
                ApplicationId   = i.ApplicationId,
                JobTitle        = i.Application.Job.Title,
                CandidateName   = i.Application.User.FullName,
                Title           = i.Title,
                Description     = i.Description,
                ScheduledAt     = i.ScheduledAt,
                DurationMinutes = i.DurationMinutes,
                MeetingLink     = i.MeetingLink,
                Status          = i.Status,
                Feedback        = i.Feedback,
                CreatedAt       = i.CreatedAt ?? DateTime.UtcNow
            })
            .ToListAsync();
    }

    private static InterviewDto MapInterviewToDto(Interview i) => new()
    {
        Id              = i.Id,
        ApplicationId   = i.ApplicationId,
        JobTitle        = i.Application?.Job?.Title,
        CandidateName   = i.Application?.User?.FullName,
        Title           = i.Title,
        Description     = i.Description,
        ScheduledAt     = i.ScheduledAt,
        DurationMinutes = i.DurationMinutes,
        MeetingLink     = i.MeetingLink,
        Status          = i.Status,
        Feedback        = i.Feedback,
        CreatedAt       = i.CreatedAt ?? DateTime.UtcNow
    };
}