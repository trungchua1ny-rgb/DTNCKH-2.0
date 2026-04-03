using TimDongDoi.API.DTOs.Test;

namespace TimDongDoi.API.Services.Interfaces;

public interface ITestService
{
    // Test CRUD (company)
    Task<TestListResponse> GetMyTests(int companyUserId, int page, int pageSize);
    Task<TestDto> GetTestById(int companyUserId, int testId);
    Task<TestDto> CreateTest(int companyUserId, CreateTestRequest request);
    Task<TestDto> UpdateTest(int companyUserId, int testId, UpdateTestRequest request);
    Task DeleteTest(int companyUserId, int testId);

    // Test Questions
    Task<List<TestQuestionDto>> GetQuestions(int companyUserId, int testId);
    Task<TestQuestionDto> AddQuestion(int companyUserId, int testId, CreateTestQuestionRequest request);
    Task<TestQuestionDto> UpdateQuestion(int companyUserId, int testId, int questionId, UpdateTestQuestionRequest request);
    Task DeleteQuestion(int companyUserId, int testId, int questionId);

    // Assign test to job
    Task<JobTestDto> AssignTestToJob(int companyUserId, int jobId, AssignTestToJobRequest request);
    Task<List<JobTestDto>> GetJobTests(int jobId);
    Task RemoveTestFromJob(int companyUserId, int jobId, int jobTestId);

    // Candidate làm test
    Task<List<ApplicationTestDto>> GetMyApplicationTests(int userId, int applicationId);
    Task<StartTestResponse> StartTest(int userId, int applicationTestId);
    Task<SubmitTestResponse> SubmitTest(int userId, int applicationTestId, SubmitTestRequest request);

    // Company xem kết quả
    Task<List<ApplicationTestDto>> GetApplicationTestResults(int companyUserId, int applicationId);

    // Interview
    Task<InterviewListResponse> GetInterviews(int companyUserId, int page, int pageSize, string? status);
    Task<InterviewDto> GetInterviewById(int companyUserId, int interviewId);
    Task<InterviewDto> CreateInterview(int companyUserId, CreateInterviewRequest request);
    Task<InterviewDto> UpdateInterview(int companyUserId, int interviewId, UpdateInterviewRequest request);
    Task<InterviewDto> SubmitFeedback(int companyUserId, int interviewId, SubmitInterviewFeedbackRequest request);
    Task<List<InterviewDto>> GetMyInterviews(int userId);
    // Lấy câu hỏi + câu trả lời của ứng viên (company xem)
Task<ApplicationTestDetailDto> GetApplicationTestDetail(int companyUserId, int applicationTestId);

// Chấm điểm thủ công cho essay/coding
Task<ApplicationTestDto> ScoreManually(int companyUserId, int applicationTestId, ManualScoreRequest request);
}