using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Project;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectsController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        // ========== PROJECT CRUD ==========

        [HttpPost]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _projectService.CreateProject(userId, request);
                return Ok(new { success = true, message = "Project created successfully", data = project });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProjectById(int id)
        {
            try
            {
                var project = await _projectService.GetProjectById(id);
                return Ok(new { success = true, data = project });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("my")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetMyProjects([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var projects = await _projectService.GetMyProjects(userId, status, page, pageSize);
                return Ok(new { success = true, data = projects });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _projectService.UpdateProject(userId, id, request);
                return Ok(new { success = true, message = "Project updated successfully", data = project });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _projectService.DeleteProject(userId, id);
                return Ok(new { success = true, message = "Project deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ========== PROJECT STATUS ==========

        [HttpPut("{id}/close")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> CloseProject(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _projectService.CloseProject(userId, id);
                return Ok(new { success = true, message = "Project closed successfully", data = project });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/reopen")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> ReopenProject(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _projectService.ReopenProject(userId, id);
                return Ok(new { success = true, message = "Project reopened successfully", data = project });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/in-progress")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> MarkAsInProgress(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _projectService.MarkAsInProgress(userId, id);
                return Ok(new { success = true, message = "Project marked as in progress", data = project });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/completed")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> MarkAsCompleted(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var project = await _projectService.MarkAsCompleted(userId, id);
                return Ok(new { success = true, message = "Project marked as completed", data = project });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}/stats")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetProjectStats(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var stats = await _projectService.GetProjectStats(userId, id);
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ========== POSITION MANAGEMENT ==========

        [HttpPost("{projectId}/positions")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> AddPosition(int projectId, [FromBody] CreatePositionDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var position = await _projectService.AddPosition(userId, projectId, request);
                return Ok(new { success = true, message = "Position added successfully", data = position });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{projectId}/positions")]
        public async Task<IActionResult> GetProjectPositions(int projectId)
        {
            try
            {
                var positions = await _projectService.GetProjectPositions(projectId);
                return Ok(new { success = true, data = positions });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("positions/{positionId}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> UpdatePosition(int positionId, [FromBody] UpdatePositionRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var position = await _projectService.UpdatePosition(userId, positionId, request);
                return Ok(new { success = true, message = "Position updated successfully", data = position });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("positions/{positionId}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> DeletePosition(int positionId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _projectService.DeletePosition(userId, positionId);
                return Ok(new { success = true, message = "Position deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ========== POSITION SKILLS ==========

        [HttpGet("positions/{positionId}/skills")]
        public async Task<IActionResult> GetPositionSkills(int positionId)
        {
            try
            {
                var skills = await _projectService.GetPositionSkills(positionId);
                return Ok(new { success = true, data = skills });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("positions/{positionId}/skills")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> AddPositionSkill(int positionId, [FromBody] AddPositionSkillRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _projectService.AddPositionSkill(userId, positionId, request);
                return Ok(new { success = true, message = "Skill added successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("positions/{positionId}/skills/{skillId}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> DeletePositionSkill(int positionId, int skillId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _projectService.DeletePositionSkill(userId, positionId, skillId);
                return Ok(new { success = true, message = "Skill removed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ========== USER APPLICATIONS ==========

        [HttpPost("{projectId}/apply")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> ApplyToProject(int projectId, [FromBody] CreateProjectApplicationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _projectService.ApplyToProject(userId, projectId, request);
                return Ok(new { success = true, message = "Application submitted successfully", data = application });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("applications/my")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetMyApplications([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var applications = await _projectService.GetMyApplications(userId, status, page, pageSize);
                return Ok(new { success = true, data = applications });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("applications/my/{id}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetMyApplicationById(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _projectService.GetMyApplicationById(userId, id);
                return Ok(new { success = true, data = application });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("applications/{id}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> WithdrawApplication(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _projectService.WithdrawApplication(userId, id);
                return Ok(new { success = true, message = "Application withdrawn successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ========== OWNER: MANAGE APPLICATIONS ==========

        [HttpGet("{projectId}/applications")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetProjectApplications(int projectId, [FromQuery] int? positionId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var applications = await _projectService.GetProjectApplications(userId, projectId, positionId, status, page, pageSize);
                return Ok(new { success = true, data = applications });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("applications/{id}/detail")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> GetApplicationDetail(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _projectService.GetApplicationDetail(userId, id);
                return Ok(new { success = true, data = application });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("applications/{id}/accept")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> AcceptApplication(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _projectService.AcceptApplication(userId, id);
                return Ok(new { success = true, message = "Application accepted successfully", data = application });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("applications/{id}/reject")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> RejectApplication(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var application = await _projectService.RejectApplication(userId, id);
                return Ok(new { success = true, message = "Application rejected successfully", data = application });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ========== MEMBER MANAGEMENT ==========

        [HttpGet("{projectId}/members")]
        public async Task<IActionResult> GetProjectMembers(int projectId, [FromQuery] string? status)
        {
            try
            {
                var members = await _projectService.GetProjectMembers(projectId, status);
                return Ok(new { success = true, data = members });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("members/{memberId}")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> RemoveMember(int memberId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _projectService.RemoveMember(userId, memberId);
                return Ok(new { success = true, message = "Member removed successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{projectId}/leave")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> LeaveProject(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _projectService.LeaveProject(userId, projectId);
                return Ok(new { success = true, message = "You have left the project successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ========== SEARCH & DISCOVERY ==========

        [HttpGet]
        public async Task<IActionResult> SearchProjects([FromQuery] ProjectSearchFilters filters)
        {
            try
            {
                var (projects, totalCount) = await _projectService.SearchProjects(filters);
                return Ok(new
                {
                    success = true,
                    data = projects,
                    pagination = new
                    {
                        page = filters.Page,
                        pageSize = filters.PageSize,
                        totalCount,
                        totalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProjects([FromQuery] int count = 10)
        {
            try
            {
                var projects = await _projectService.GetFeaturedProjects(count);
                return Ok(new { success = true, data = projects });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}