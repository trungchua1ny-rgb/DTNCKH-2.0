using TimDongDoi.API.DTOs.User;

namespace TimDongDoi.API.Services.Interfaces
{
    public interface IUserProfileService
    {
        // Upload avatar → trả về đường dẫn file
        Task<string> UploadAvatar(int userId, IFormFile file);

        // Upload CV → trả về đường dẫn file
        Task<string> UploadCv(int userId, IFormFile file);

        // ===== EXPERIENCES =====
        Task<List<UserExperienceDto>> GetExperiences(int userId);
        Task<UserExperienceDto> AddExperience(int userId, UserExperienceRequest request);
        Task<UserExperienceDto> UpdateExperience(int userId, int id, UserExperienceRequest request);
        Task DeleteExperience(int userId, int id);

        // ===== EDUCATIONS =====
        Task<List<UserEducationDto>> GetEducations(int userId);
        Task<UserEducationDto> AddEducation(int userId, UserEducationRequest request);
        Task<UserEducationDto> UpdateEducation(int userId, int id, UserEducationRequest request);
        Task DeleteEducation(int userId, int id);
    }
}