using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SkillsController : ControllerBase
    {
        private readonly ISkillService _skillService;

        public SkillsController(ISkillService skillService)
        {
            _skillService = skillService;
        }

        // GET: api/skills
        [HttpGet]
        public async Task<IActionResult> GetAllSkills()
        {
            var skills = await _skillService.GetAllSkills();
            return Ok(new { success = true, data = skills });
        }

        // GET: api/skills/search?q=react
        [HttpGet("search")]
        public async Task<IActionResult> SearchSkills([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { success = false, message = "Query không được để trống." });
            }

            var skills = await _skillService.SearchSkills(q);
            return Ok(new { success = true, data = skills });
        }

        // POST: api/skills (Admin only)
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateSkill([FromBody] CreateSkillRequest request)
        {
            try
            {
                var skill = await _skillService.CreateSkill(request.Name, request.Category, request.Icon);
                return CreatedAtAction(nameof(GetAllSkills), new { id = skill.Id }, new { success = true, data = skill });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    public class CreateSkillRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Icon { get; set; }
    }
}