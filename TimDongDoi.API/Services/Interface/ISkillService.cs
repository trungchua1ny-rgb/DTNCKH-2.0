using TimDongDoi.API.DTOs.Skill;

namespace TimDongDoi.API.Services.Interfaces
{
    public interface ISkillService
    {
        // Quản lý Skills hệ thống (Admin)
        Task<List<SkillDto>> GetAllSkills();
        Task<List<SkillDto>> SearchSkills(string query);
        Task<SkillDto> CreateSkill(string name, string? category, string? icon);

        // Quản lý User Skills
        Task<List<UserSkillDto>> GetUserSkills(int userId);
        Task<UserSkillDto> AddUserSkill(int userId, AddUserSkillRequest request);
        Task<UserSkillDto> UpdateUserSkill(int userId, int userSkillId, UpdateUserSkillRequest request);
        Task DeleteUserSkill(int userId, int userSkillId);
    }
}