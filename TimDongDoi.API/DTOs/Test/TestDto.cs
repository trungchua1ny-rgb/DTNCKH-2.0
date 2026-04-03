using System.ComponentModel.DataAnnotations;

namespace TimDongDoi.API.DTOs.Test;

// ==================== TEST ====================
public class TestDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public int? PassingScore { get; set; }
    public string? Status { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalPoints { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTestRequest
{
    [Required][MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public int? PassingScore { get; set; }
}

public class UpdateTestRequest
{
    [MaxLength(200)]
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public int? PassingScore { get; set; }
    public string? Status { get; set; } // draft, active, inactive
}

public class TestListResponse
{
    public List<TestDto> Tests { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

// ==================== TEST QUESTION ====================
public class TestQuestionDto
{
    public int Id { get; set; }
    public int TestId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Options { get; set; }
    public string? CorrectAnswer { get; set; }
    public int Points { get; set; }
    public int OrderNum { get; set; }
}

// Dùng khi candidate làm bài - ẩn CorrectAnswer
public class TestQuestionForCandidateDto
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Options { get; set; }
    public int Points { get; set; }
    public int OrderNum { get; set; }
}

public class CreateTestQuestionRequest
{
    [Required]
    public string Question { get; set; } = string.Empty;
    [Required]
    public string Type { get; set; } = string.Empty; // multiple_choice, essay, coding
    public string? Options { get; set; }   // JSON string cho multiple_choice
    public string? CorrectAnswer { get; set; }
    public int Points { get; set; } = 1;
    public int OrderNum { get; set; } = 0;
}

public class UpdateTestQuestionRequest
{
    public string? Question { get; set; }
    public string? Type { get; set; }
    public string? Options { get; set; }
    public string? CorrectAnswer { get; set; }
    public int? Points { get; set; }
    public int? OrderNum { get; set; }
}

// ==================== JOB TEST ====================
public class JobTestDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int TestId { get; set; }
    public string TestTitle { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    public int? PassingScore { get; set; }
    public bool IsRequired { get; set; }
}

public class AssignTestToJobRequest
{
    [Required] public int TestId { get; set; }
    public bool IsRequired { get; set; } = false;
}

// ==================== APPLICATION TEST ====================
public class ApplicationTestDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int TestId { get; set; }
    public string TestTitle { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    public int? PassingScore { get; set; }
    public string? Status { get; set; }
    public int? Score { get; set; }
    public bool? Passed { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class StartTestResponse
{
    public int ApplicationTestId { get; set; }
    public string TestTitle { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalPoints { get; set; }
    public List<TestQuestionForCandidateDto> Questions { get; set; } = new();
    public DateTime StartedAt { get; set; }
}

public class SubmitTestRequest
{
    [Required]
    public string Answers { get; set; } = string.Empty; // JSON: {"questionId": "answer"}
}

public class SubmitTestResponse
{
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public int? PassingScore { get; set; }
    public bool Passed { get; set; }
    public DateTime CompletedAt { get; set; }
}

// ==================== INTERVIEW ====================
public class InterviewDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string? JobTitle { get; set; }
    public string? CandidateName { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? MeetingLink { get; set; }
    public string? Status { get; set; }
    public string? Feedback { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateInterviewRequest
{
    [Required] public int ApplicationId { get; set; }
    [Required][MaxLength(200)] public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required] public DateTime ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? MeetingLink { get; set; }
}

public class UpdateInterviewRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? MeetingLink { get; set; }
    public string? Status { get; set; } // scheduled, completed, cancelled
}

public class SubmitInterviewFeedbackRequest
{
    [Required] public string Feedback { get; set; } = string.Empty;
    [Required] public string Status { get; set; } = string.Empty; // completed, cancelled
}

public class InterviewListResponse
{
    public List<InterviewDto> Interviews { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
public class ApplicationTestDetailDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string ?TestTitle { get; set; }
    public int? Score { get; set; }
    public int? PassingScore { get; set; }
    public bool? Passed { get; set; }
    public string ?Status { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<QuestionWithAnswerDto> ?Questions { get; set; }
}

public class QuestionWithAnswerDto
{
    public int Id { get; set; }
    public string ?Question { get; set; }
    public string ?Type { get; set; }
    public string ?Options { get; set; }       // JSON
    public string ?CorrectAnswer { get; set; } // null nếu essay/coding
    public string ?UserAnswer { get; set; }    // câu trả lời của ứng viên
    public int Points { get; set; }
    public int OrderNum { get; set; }
    public bool IsAutoGraded { get; set; }    // true = multiple_choice
    public int? ManualScore { get; set; }     // điểm chấm tay
    public string ?Feedback { get; set; }      // nhận xét của company
}

public class ManualScoreRequest
{
    public List<QuestionScore> ?Scores { get; set; }
}

public class QuestionScore
{
    public int QuestionId { get; set; }
    public int Score { get; set; }      // 0 → Points
    public string ?Feedback { get; set; }
}