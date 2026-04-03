using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Skill;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    [ApiController]
    [Route("api/users/me/skills")]
    [Authorize] // Chỉ user đã login
    public class UserSkillsController : ControllerBase
    {
        private readonly ISkillService _skillService;

        public UserSkillsController(ISkillService skillService)
        {
            _skillService = skillService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim!);
        }

        // GET: api/users/me/skills
        [HttpGet]
        public async Task<IActionResult> GetMySkills()
        {
            var userId = GetUserId();
            var skills = await _skillService.GetUserSkills(userId);
            return Ok(new { success = true, data = skills });
        }

        // POST: api/users/me/skills
        [HttpPost]
        public async Task<IActionResult> AddSkill([FromBody] AddUserSkillRequest request)
        {
            try
            {
                var userId = GetUserId();
                var skill = await _skillService.AddUserSkill(userId, request);
                return CreatedAtAction(nameof(GetMySkills), new { success = true, data = skill });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/users/me/skills/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSkill(int id, [FromBody] UpdateUserSkillRequest request)
        {
            try
            {
                var userId = GetUserId();
                var skill = await _skillService.UpdateUserSkill(userId, id, request);
                return Ok(new { success = true, data = skill });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/users/me/skills/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSkill(int id)
        {
            try
            {
                var userId = GetUserId();
                await _skillService.DeleteUserSkill(userId, id);
                return Ok(new { success = true, message = "Đã xóa skill thành công." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }
    }
}