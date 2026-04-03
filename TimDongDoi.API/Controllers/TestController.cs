using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Test;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers;

[ApiController]
[Route("api/tests")]
[Authorize]
public class TestsController : ControllerBase
{
    private readonly ITestService _testService;

    public TestsController(ITestService testService)
    {
        _testService = testService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    // ==================== TEST CRUD (company) ====================

    // GET /api/tests
    [HttpGet]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> GetMyTests(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _testService.GetMyTests(GetCurrentUserId(), page, pageSize);
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/tests/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> GetTestById(int id)
    {
        try
        {
            var result = await _testService.GetTestById(GetCurrentUserId(), id);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // POST /api/tests
    [HttpPost]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> CreateTest([FromBody] CreateTestRequest request)
    {
        try
        {
            var result = await _testService.CreateTest(GetCurrentUserId(), request);
            return Ok(new { success = true, message = "Test created", data = result });
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // PUT /api/tests/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> UpdateTest(int id, [FromBody] UpdateTestRequest request)
    {
        try
        {
            var result = await _testService.UpdateTest(GetCurrentUserId(), id, request);
            return Ok(new { success = true, message = "Test updated", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // DELETE /api/tests/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> DeleteTest(int id)
    {
        try
        {
            await _testService.DeleteTest(GetCurrentUserId(), id);
            return Ok(new { success = true, message = "Test deleted" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== TEST QUESTIONS ====================

    // GET /api/tests/{id}/questions
    [HttpGet("{id}/questions")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> GetQuestions(int id)
    {
        try
        {
            var result = await _testService.GetQuestions(GetCurrentUserId(), id);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // POST /api/tests/{id}/questions
    [HttpPost("{id}/questions")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> AddQuestion(int id, [FromBody] CreateTestQuestionRequest request)
    {
        try
        {
            var result = await _testService.AddQuestion(GetCurrentUserId(), id, request);
            return Ok(new { success = true, message = "Question added", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // PUT /api/tests/{id}/questions/{questionId}
    [HttpPut("{id}/questions/{questionId}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> UpdateQuestion(int id, int questionId, [FromBody] UpdateTestQuestionRequest request)
    {
        try
        {
            var result = await _testService.UpdateQuestion(GetCurrentUserId(), id, questionId, request);
            return Ok(new { success = true, message = "Question updated", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // DELETE /api/tests/{id}/questions/{questionId}
    [HttpDelete("{id}/questions/{questionId}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> DeleteQuestion(int id, int questionId)
    {
        try
        {
            await _testService.DeleteQuestion(GetCurrentUserId(), id, questionId);
            return Ok(new { success = true, message = "Question deleted" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== ASSIGN TEST TO JOB ====================

    // GET /api/tests/jobs/{jobId}
    [HttpGet("jobs/{jobId}")]
    public async Task<IActionResult> GetJobTests(int jobId)
    {
        try
        {
            var result = await _testService.GetJobTests(jobId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // POST /api/tests/jobs/{jobId}/assign
    [HttpPost("jobs/{jobId}/assign")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> AssignTestToJob(int jobId, [FromBody] AssignTestToJobRequest request)
    {
        try
        {
            var result = await _testService.AssignTestToJob(GetCurrentUserId(), jobId, request);
            return Ok(new { success = true, message = "Test assigned to job", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // DELETE /api/tests/jobs/{jobId}/assign/{jobTestId}
    [HttpDelete("jobs/{jobId}/assign/{jobTestId}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> RemoveTestFromJob(int jobId, int jobTestId)
    {
        try
        {
            await _testService.RemoveTestFromJob(GetCurrentUserId(), jobId, jobTestId);
            return Ok(new { success = true, message = "Test removed from job" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== CANDIDATE LÀM TEST ====================

    // GET /api/tests/applications/{applicationId}
    [HttpGet("applications/{applicationId}")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> GetMyApplicationTests(int applicationId)
    {
        try
        {
            var result = await _testService.GetMyApplicationTests(GetCurrentUserId(), applicationId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // POST /api/tests/application-tests/{applicationTestId}/start
    [HttpPost("application-tests/{applicationTestId}/start")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> StartTest(int applicationTestId)
    {
        try
        {
            var result = await _testService.StartTest(GetCurrentUserId(), applicationTestId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // POST /api/tests/application-tests/{applicationTestId}/submit
    [HttpPost("application-tests/{applicationTestId}/submit")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> SubmitTest(int applicationTestId, [FromBody] SubmitTestRequest request)
    {
        try
        {
            var result = await _testService.SubmitTest(GetCurrentUserId(), applicationTestId, request);
            return Ok(new { success = true, message = "Test submitted", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/tests/applications/{applicationId}/results (company xem)
    [HttpGet("applications/{applicationId}/results")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> GetApplicationTestResults(int applicationId)
    {
        try
        {
            var result = await _testService.GetApplicationTestResults(GetCurrentUserId(), applicationId);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // ==================== INTERVIEW ====================

    // GET /api/tests/interviews
    [HttpGet("interviews")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> GetInterviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
    {
        try
        {
            var result = await _testService.GetInterviews(GetCurrentUserId(), page, pageSize, status);
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/tests/interviews/{id}
    [HttpGet("interviews/{id}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> GetInterviewById(int id)
    {
        try
        {
            var result = await _testService.GetInterviewById(GetCurrentUserId(), id);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // POST /api/tests/interviews
    [HttpPost("interviews")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> CreateInterview([FromBody] CreateInterviewRequest request)
    {
        try
        {
            var result = await _testService.CreateInterview(GetCurrentUserId(), request);
            return Ok(new { success = true, message = "Interview scheduled", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // PUT /api/tests/interviews/{id}
    [HttpPut("interviews/{id}")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> UpdateInterview(int id, [FromBody] UpdateInterviewRequest request)
    {
        try
        {
            var result = await _testService.UpdateInterview(GetCurrentUserId(), id, request);
            return Ok(new { success = true, message = "Interview updated", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // PUT /api/tests/interviews/{id}/feedback
    [HttpPut("interviews/{id}/feedback")]
    [Authorize(Roles = "company")]
    public async Task<IActionResult> SubmitFeedback(int id, [FromBody] SubmitInterviewFeedbackRequest request)
    {
        try
        {
            var result = await _testService.SubmitFeedback(GetCurrentUserId(), id, request);
            return Ok(new { success = true, message = "Feedback submitted", data = result });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }

    // GET /api/tests/interviews/my (candidate xem lịch phỏng vấn của mình)
    [HttpGet("interviews/my")]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> GetMyInterviews()
    {
        try
        {
            var result = await _testService.GetMyInterviews(GetCurrentUserId());
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
    }
    // GET /api/tests/application-tests/{applicationTestId}/detail
[HttpGet("application-tests/{applicationTestId}/detail")]
[Authorize(Roles = "company")]
public async Task<IActionResult> GetApplicationTestDetail(int applicationTestId)
{
    try
    {
        var result = await _testService.GetApplicationTestDetail(GetCurrentUserId(), applicationTestId);
        return Ok(new { success = true, data = result });
    }
    catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
    catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
    catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
}

// PUT /api/tests/application-tests/{applicationTestId}/score
[HttpPut("application-tests/{applicationTestId}/score")]
[Authorize(Roles = "company")]
public async Task<IActionResult> ScoreManually(int applicationTestId, [FromBody] ManualScoreRequest request)
{
    try
    {
        var result = await _testService.ScoreManually(GetCurrentUserId(), applicationTestId, request);
        return Ok(new { success = true, message = "Scored successfully", data = result });
    }
    catch (KeyNotFoundException ex) { return NotFound(new { success = false, message = ex.Message }); }
    catch (UnauthorizedAccessException ex) { return Unauthorized(new { success = false, message = ex.Message }); }
    catch (InvalidOperationException ex) { return BadRequest(new { success = false, message = ex.Message }); }
    catch (Exception ex) { return StatusCode(500, new { success = false, message = ex.Message }); }
}
}