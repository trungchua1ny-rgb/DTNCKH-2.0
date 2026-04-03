using TimDongDoi.API.DTOs.Project;

namespace TimDongDoi.API.Services.Interfaces
{
    public interface IProjectService
    {
        // PROJECT CRUD
        Task<ProjectDto> CreateProject(int userId, CreateProjectRequest request);
        Task<ProjectDto> GetProjectById(int projectId);
        Task<ProjectDto> GetMyProject(int userId, int projectId);
        Task<List<ProjectListDto>> GetMyProjects(int userId, string? status, int page, int pageSize);
        Task<ProjectDto> UpdateProject(int userId, int projectId, UpdateProjectRequest request);
        Task DeleteProject(int userId, int projectId);
        
        // PROJECT STATUS
        Task<ProjectDto> CloseProject(int userId, int projectId);
        Task<ProjectDto> ReopenProject(int userId, int projectId);
        Task<ProjectDto> MarkAsInProgress(int userId, int projectId);
        Task<ProjectDto> MarkAsCompleted(int userId, int projectId);
        Task<ProjectStatsDto> GetProjectStats(int userId, int projectId);

        // POSITION MANAGEMENT
        Task<PositionDto> AddPosition(int userId, int projectId, CreatePositionDto request);
        Task<List<PositionDto>> GetProjectPositions(int projectId);
        Task<PositionDto> UpdatePosition(int userId, int positionId, UpdatePositionRequest request);
        Task DeletePosition(int userId, int positionId);
        
        // POSITION SKILLS
        Task<List<PositionSkillDto>> GetPositionSkills(int positionId);
        Task AddPositionSkill(int userId, int positionId, AddPositionSkillRequest request);
        Task DeletePositionSkill(int userId, int positionId, int skillId);

        // USER APPLICATIONS
        Task<ProjectApplicationDto> ApplyToProject(int userId, int projectId, CreateProjectApplicationRequest request);
        Task<List<ProjectApplicationDto>> GetMyApplications(int userId, string? status, int page, int pageSize);
        Task<ProjectApplicationDto> GetMyApplicationById(int userId, int applicationId);
        Task WithdrawApplication(int userId, int applicationId);

        // OWNER: MANAGE APPLICATIONS
        Task<List<ProjectApplicationDto>> GetProjectApplications(int userId, int projectId, int? positionId, string? status, int page, int pageSize);
        Task<ProjectApplicationDto> GetApplicationDetail(int userId, int applicationId);
        Task<ProjectApplicationDto> AcceptApplication(int userId, int applicationId);
        Task<ProjectApplicationDto> RejectApplication(int userId, int applicationId);

        // MEMBER MANAGEMENT
        Task<List<ProjectMemberDto>> GetProjectMembers(int projectId, string? status);
        Task RemoveMember(int userId, int memberId);
        Task LeaveProject(int userId, int projectId);

        // SEARCH & DISCOVERY
        Task<(List<ProjectListDto> Projects, int TotalCount)> SearchProjects(ProjectSearchFilters filters);
        Task<List<ProjectListDto>> GetFeaturedProjects(int count);
    }
}