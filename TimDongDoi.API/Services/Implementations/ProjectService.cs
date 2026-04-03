using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Project;
using TimDongDoi.API.DTOs.Notification; // ✅ Thêm namespace Notification
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations
{
    public class ProjectService : IProjectService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService; // ✅ Thêm Notification Service

        // ✅ Tiêm INotificationService vào Constructor
        public ProjectService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        #region PROJECT CRUD

        public async Task<ProjectDto> CreateProject(int userId, CreateProjectRequest request)
        {
            // 1. Tạo Project chính
            var project = new Project
            {
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                DurationMonths = request.DurationMonths,
                LocationType = request.LocationType,
                CompensationType = request.CompensationType,
                CompensationDetails = request.CompensationDetails,
                Status = "open",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Projects.Add(project);
            
            // 2. Thêm founder vào Member
            var founder = new ProjectMember
            {
                Project = project, // Dùng Navigation Property thay vì Id
                UserId = userId,
                RoleType = "founder",
                Status = "active",
                JoinedAt = DateOnly.FromDateTime(DateTime.Now)
            };
            _context.ProjectMembers.Add(founder);

            // 3. Xử lý Positions và Skills
            if (request.Positions != null)
            {
                foreach (var posDto in request.Positions)
                {
                    var position = new ProjectPosition
                    {
                        Project = project,
                        Role = posDto.Role,
                        Quantity = posDto.Quantity,
                        Requirements = posDto.Requirements,
                        CreatedAt = DateTime.Now
                    };
                    _context.ProjectPositions.Add(position);

                    if (posDto.RequiredSkillIds != null)
                    {
                        foreach (var sId in posDto.RequiredSkillIds)
                        {
                            _context.ProjectPositionSkills.Add(new ProjectPositionSkill 
                            { 
                                Position = position, 
                                SkillId = sId, 
                                IsRequired = true 
                            });
                        }
                    }
                }
            }

            // 4. CHỈ GỌI MỘT LẦN DUY NHẤT ĐỂ ĐẢM BẢO TÍNH TOÀN VẸN
            await _context.SaveChangesAsync();

            return await GetProjectById(project.Id);
        }

        public async Task<ProjectDto> GetProjectById(int projectId)
        {
            var project = await _context.Projects
                .AsNoTracking()
                .Include(p => p.User) // <--- SỬA DÒNG NÀY TẠI ĐÂY
                .Include(p => p.ProjectPositions)
                    .ThenInclude(pos => pos.ProjectPositionSkills)
                        .ThenInclude(s => s.Skill)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                throw new KeyNotFoundException("Project not found");

            var projectToUpdate = await _context.Projects.FindAsync(projectId);
            if (projectToUpdate != null)
            {
                // FIX: Views la int (non-nullable), dung truc tiep
                projectToUpdate.Views = projectToUpdate.Views + 1;
                await _context.SaveChangesAsync();
            }

            var positions = project.ProjectPositions.Select(pos => new PositionDto
            {
                Id = pos.Id,
                ProjectId = pos.ProjectId,
                Role = pos.Role,
                // FIX: Quantity la int (non-nullable)
                Quantity = pos.Quantity,
                Requirements = pos.Requirements,
                Status = pos.Status,
                // FIX: CreatedAt la DateTime (non-nullable)
                CreatedAt = pos.CreatedAt,
                Skills = pos.ProjectPositionSkills.Select(s => new PositionSkillDto
                {
                    SkillId = s.SkillId,
                    SkillName = s.Skill!.Name,
                    // FIX: IsRequired la bool (non-nullable)
                    IsRequired = s.IsRequired
                }).ToList(),
                TotalApplications = _context.ProjectApplications.Count(a => a.PositionId == pos.Id),
                CurrentMembers = _context.ProjectMembers.Count(m => m.PositionId == pos.Id && m.Status == "active")
            }).ToList();

            var stats = await GetStatsForProject(projectId);

            return new ProjectDto
            {
                Id = project.Id,
                UserId = project.UserId,
                Title = project.Title,
                Description = project.Description,
                Type = project.Type,
                DurationMonths = project.DurationMonths,
                LocationType = project.LocationType,
                CompensationType = project.CompensationType,
                CompensationDetails = project.CompensationDetails,
                Status = project.Status,
                // FIX: Views la int (non-nullable)
                Views = projectToUpdate != null ? projectToUpdate.Views : project.Views,
                // FIX: CreatedAt, UpdatedAt la DateTime (non-nullable)
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                Owner = new UserBasicDto
                {
                    Id = project.User!.Id,
                    FullName = project.User.FullName ?? "",
                    Avatar = project.User.Avatar,
                    JobTitle = project.User.JobTitle
                },
                Positions = positions,
                Stats = stats
            };
        }

        public async Task<ProjectDto> GetMyProject(int userId, int projectId)
        {
            var project = await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

            if (project == null)
                throw new KeyNotFoundException("Project not found or you don't have permission");

            return await GetProjectById(projectId);
        }

        public async Task<List<ProjectListDto>> GetMyProjects(int userId, string? status, int page, int pageSize)
        {
            var query = _context.Projects
                .AsNoTracking()
                .Where(p => p.UserId == userId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(p => p.Status == status);

            var projects = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include("User")
                .ToListAsync();

            return projects.Select(p => new ProjectListDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                Type = p.Type,
                LocationType = p.LocationType,
                CompensationType = p.CompensationType,
                Status = p.Status,
                // FIX: Views, CreatedAt non-nullable
                Views = p.Views,
                CreatedAt = p.CreatedAt,
                Owner = new UserBasicDto
                {
                    Id = p.User!.Id,
                    FullName = p.User.FullName ?? "",
                    Avatar = p.User.Avatar,
                    JobTitle = p.User.JobTitle
                },
                OpenPositions = _context.ProjectPositions.Count(pos => pos.ProjectId == p.Id && pos.Status == "open"),
                TotalApplications = _context.ProjectApplications.Count(a => a.ProjectId == p.Id)
            }).ToList();
        }

        public async Task<ProjectDto> UpdateProject(int userId, int projectId, UpdateProjectRequest request)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                throw new KeyNotFoundException("Project not found");

            if (project.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            if (request.Title != null) project.Title = request.Title;
            if (request.Description != null) project.Description = request.Description;
            if (request.Type != null) project.Type = request.Type;
            if (request.DurationMonths.HasValue) project.DurationMonths = request.DurationMonths;
            if (request.LocationType != null) project.LocationType = request.LocationType;
            if (request.CompensationType != null) project.CompensationType = request.CompensationType;
            if (request.CompensationDetails != null) project.CompensationDetails = request.CompensationDetails;

            project.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return await GetProjectById(projectId);
        }

        public async Task DeleteProject(int userId, int projectId)
        {
            // 1. Tìm Project KÈM THEO tất cả dữ liệu con để chuẩn bị xóa
            var project = await _context.Projects
                .Include(p => p.ProjectMembers)
                .Include(p => p.ProjectApplications)
                .Include(p => p.ProjectPositions)
                    .ThenInclude(pp => pp.ProjectPositionSkills)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                throw new KeyNotFoundException("Project not found");

            // 2. Giữ nguyên logic kiểm tra quyền của bạn
            if (project.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            // 3. Giữ nguyên logic kiểm tra thành viên active của bạn
            var hasActiveMembers = project.ProjectMembers
                .Any(m => m.Status == "active" && m.RoleType != "founder");

            if (hasActiveMembers)
                throw new InvalidOperationException("Cannot delete project with active members");

            // ================= BẮT ĐẦU DỌN DẸP DỮ LIỆU CON TRƯỚC (ĐỂ FIX LỖI 500) =================

            // Xóa tất cả ProjectMembers (bao gồm cả founder hoặc những người đã left)
            if (project.ProjectMembers.Any())
            {
                _context.ProjectMembers.RemoveRange(project.ProjectMembers);
            }

            // Xóa tất cả ProjectApplications (đơn đang chờ duyệt, đã từ chối...)
            if (project.ProjectApplications.Any())
            {
                _context.ProjectApplications.RemoveRange(project.ProjectApplications);
            }

            // Xóa tất cả Vị trí (Positions) và Kỹ năng yêu cầu của vị trí đó
            foreach (var position in project.ProjectPositions)
            {
                if (position.ProjectPositionSkills.Any())
                {
                    _context.ProjectPositionSkills.RemoveRange(position.ProjectPositionSkills);
                }
            }
            if (project.ProjectPositions.Any())
            {
                _context.ProjectPositions.RemoveRange(project.ProjectPositions);
            }

            // ================= CUỐI CÙNG MỚI XÓA DỰ ÁN =================
            
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region PROJECT STATUS
        // ... (Giữ nguyên các hàm CloseProject, ReopenProject, MarkAsInProgress, MarkAsCompleted, GetProjectStats) ...
        public async Task<ProjectDto> CloseProject(int userId, int projectId)
        {
            var project = await VerifyProjectOwnership(userId, projectId);
            project.Status = "closed";
            project.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return await GetProjectById(projectId);
        }

        public async Task<ProjectDto> ReopenProject(int userId, int projectId)
        {
            var project = await VerifyProjectOwnership(userId, projectId);
            if (project.Status != "closed")
                throw new InvalidOperationException("Only closed projects can be reopened");

            project.Status = "open";
            project.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return await GetProjectById(projectId);
        }

        public async Task<ProjectDto> MarkAsInProgress(int userId, int projectId)
        {
            var project = await VerifyProjectOwnership(userId, projectId);
            project.Status = "in_progress";
            project.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return await GetProjectById(projectId);
        }

        public async Task<ProjectDto> MarkAsCompleted(int userId, int projectId)
        {
            var project = await VerifyProjectOwnership(userId, projectId);
            project.Status = "completed";
            project.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return await GetProjectById(projectId);
        }

        public async Task<ProjectStatsDto> GetProjectStats(int userId, int projectId)
        {
            await VerifyProjectOwnership(userId, projectId);
            return await GetStatsForProject(projectId);
        }
        #endregion

        #region POSITION MANAGEMENT
        // ... (Giữ nguyên các hàm AddPosition, GetProjectPositions, UpdatePosition, DeletePosition) ...
        public async Task<PositionDto> AddPosition(int userId, int projectId, CreatePositionDto request)
        {
            var project = await VerifyProjectOwnership(userId, projectId);

            var position = new ProjectPosition
            {
                ProjectId = projectId,
                Role = request.Role,
                Quantity = request.Quantity,
                Requirements = request.Requirements,
                Status = "open",
                CreatedAt = DateTime.Now
            };

            _context.ProjectPositions.Add(position);
            await _context.SaveChangesAsync();

            if (request.RequiredSkillIds != null && request.RequiredSkillIds.Any())
            {
                foreach (var skillId in request.RequiredSkillIds)
                {
                    _context.ProjectPositionSkills.Add(new ProjectPositionSkill
                    {
                        PositionId = position.Id,
                        SkillId = skillId,
                        IsRequired = true
                    });
                }
            }

            if (request.PreferredSkillIds != null && request.PreferredSkillIds.Any())
            {
                foreach (var skillId in request.PreferredSkillIds)
                {
                    _context.ProjectPositionSkills.Add(new ProjectPositionSkill
                    {
                        PositionId = position.Id,
                        SkillId = skillId,
                        IsRequired = false
                    });
                }
            }

            await _context.SaveChangesAsync();
            return await GetPositionDtoById(position.Id);
        }

        public async Task<List<PositionDto>> GetProjectPositions(int projectId)
        {
            var positions = await _context.ProjectPositions
                .AsNoTracking()
                .Where(p => p.ProjectId == projectId)
                .Include(p => p.ProjectPositionSkills)
                    .ThenInclude(s => s.Skill)
                .ToListAsync();

            return positions.Select(pos => new PositionDto
            {
                Id = pos.Id,
                ProjectId = pos.ProjectId,
                Role = pos.Role,
                // FIX: non-nullable
                Quantity = pos.Quantity,
                Requirements = pos.Requirements,
                Status = pos.Status,
                CreatedAt = pos.CreatedAt,
                Skills = pos.ProjectPositionSkills.Select(s => new PositionSkillDto
                {
                    SkillId = s.SkillId,
                    SkillName = s.Skill!.Name,
                    IsRequired = s.IsRequired
                }).ToList(),
                TotalApplications = _context.ProjectApplications.Count(a => a.PositionId == pos.Id),
                CurrentMembers = _context.ProjectMembers.Count(m => m.PositionId == pos.Id && m.Status == "active")
            }).ToList();
        }

        public async Task<PositionDto> UpdatePosition(int userId, int positionId, UpdatePositionRequest request)
        {
            var position = await _context.ProjectPositions
                .Include(p => p.Project)
                .FirstOrDefaultAsync(p => p.Id == positionId);

            if (position == null)
                throw new KeyNotFoundException("Position not found");

            if (position.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            if (request.Role != null) position.Role = request.Role;
            // FIX: Quantity la int (non-nullable), phai dung .Value khi gan tu int?
            if (request.Quantity.HasValue) position.Quantity = request.Quantity.Value;
            if (request.Requirements != null) position.Requirements = request.Requirements;

            await _context.SaveChangesAsync();
            return await GetPositionDtoById(positionId);
        }

        public async Task DeletePosition(int userId, int positionId)
        {
            var position = await _context.ProjectPositions
                .Include(p => p.Project)
                .FirstOrDefaultAsync(p => p.Id == positionId);

            if (position == null)
                throw new KeyNotFoundException("Position not found");

            if (position.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            var hasPendingApps = await _context.ProjectApplications
                .AnyAsync(a => a.PositionId == positionId && a.Status == "pending");

            if (hasPendingApps)
                throw new InvalidOperationException("Cannot delete position with pending applications");

            _context.ProjectPositions.Remove(position);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region POSITION SKILLS
        // ... (Giữ nguyên các hàm GetPositionSkills, AddPositionSkill, DeletePositionSkill) ...
        public async Task<List<PositionSkillDto>> GetPositionSkills(int positionId)
        {
            var skills = await _context.ProjectPositionSkills
                .AsNoTracking()
                .Where(s => s.PositionId == positionId)
                .Include(s => s.Skill)
                .ToListAsync();

            return skills.Select(s => new PositionSkillDto
            {
                SkillId = s.SkillId,
                SkillName = s.Skill!.Name,
                // FIX: IsRequired la bool (non-nullable)
                IsRequired = s.IsRequired
            }).ToList();
        }

        public async Task AddPositionSkill(int userId, int positionId, AddPositionSkillRequest request)
        {
            var position = await _context.ProjectPositions
                .Include(p => p.Project)
                .FirstOrDefaultAsync(p => p.Id == positionId);

            if (position == null)
                throw new KeyNotFoundException("Position not found");

            if (position.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            var skillExists = await _context.Skills.AnyAsync(s => s.Id == request.SkillId);
            if (!skillExists)
                throw new KeyNotFoundException("Skill not found");

            var alreadyExists = await _context.ProjectPositionSkills
                .AnyAsync(s => s.PositionId == positionId && s.SkillId == request.SkillId);

            if (alreadyExists)
                throw new InvalidOperationException("Skill already added to this position");

            _context.ProjectPositionSkills.Add(new ProjectPositionSkill
            {
                PositionId = positionId,
                SkillId = request.SkillId,
                IsRequired = request.IsRequired
            });

            await _context.SaveChangesAsync();
        }

        public async Task DeletePositionSkill(int userId, int positionId, int skillId)
        {
            var position = await _context.ProjectPositions
                .Include(p => p.Project)
                .FirstOrDefaultAsync(p => p.Id == positionId);

            if (position == null)
                throw new KeyNotFoundException("Position not found");

            if (position.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            var positionSkill = await _context.ProjectPositionSkills
                .FirstOrDefaultAsync(s => s.PositionId == positionId && s.SkillId == skillId);

            if (positionSkill == null)
                throw new KeyNotFoundException("Skill not found in this position");

            _context.ProjectPositionSkills.Remove(positionSkill);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region USER APPLICATIONS

        public async Task<ProjectApplicationDto> ApplyToProject(int userId, int projectId, CreateProjectApplicationRequest request)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                throw new KeyNotFoundException("Project not found");

            if (project.Status != "open")
                throw new InvalidOperationException("This project is not accepting applications");

            if (project.UserId == userId)
                throw new InvalidOperationException("You cannot apply to your own project");

            var position = await _context.ProjectPositions.FindAsync(request.PositionId);
            if (position == null || position.ProjectId != projectId)
                throw new KeyNotFoundException("Position not found in this project");

            if (position.Status != "open")
                throw new InvalidOperationException("This position is not accepting applications");

            var existingApp = await _context.ProjectApplications
                .FirstOrDefaultAsync(a => a.ProjectId == projectId && a.PositionId == request.PositionId && a.UserId == userId);

            if (existingApp != null)
                throw new InvalidOperationException("You have already applied to this position");

            var application = new ProjectApplication
            {
                ProjectId = projectId,
                PositionId = request.PositionId,
                UserId = userId,
                CoverLetter = request.CoverLetter,
                PortfolioLink = request.PortfolioLink,
                Status = "pending",
                AppliedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.ProjectApplications.Add(application);
            await _context.SaveChangesAsync();

            // ====== ✅ THÔNG BÁO ======
            var applicant = await _context.Users.FindAsync(userId);

            // 1. Thông báo cho người ứng tuyển
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "project_application",
                Title = "Ứng tuyển dự án thành công! 🎉",
                Content = $"Bạn đã nộp đơn tham gia dự án \"{project.Title}\" cho vị trí \"{position.Role}\". Hãy chờ leader duyệt nhé!",
                Data = $"{{\"projectId\": {projectId}, \"applicationId\": {application.Id}}}"
            });

            // 2. Thông báo cho Leader của dự án
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = project.UserId,
                Type = "project_application",
                Title = "Có đồng đội mới xin gia nhập! 📋",
                Content = $"{applicant?.FullName ?? "Ai đó"} vừa ứng tuyển vị trí \"{position.Role}\" trong dự án \"{project.Title}\".",
                Data = $"{{\"projectId\": {projectId}, \"applicationId\": {application.Id}}}"
            });

            return await GetApplicationDtoById(application.Id);
        }

        public async Task<List<ProjectApplicationDto>> GetMyApplications(int userId, string? status, int page, int pageSize)
        {
            var query = _context.ProjectApplications
                .AsNoTracking()
                .Where(a => a.UserId == userId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            var applications = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.Project!)
                    .ThenInclude(p => p.User)
                .Include(a => a.Position)
                .ToListAsync();

            return applications.Select(a => MapToApplicationDto(a)).ToList();
        }

        public async Task<ProjectApplicationDto> GetMyApplicationById(int userId, int applicationId)
        {
            var application = await _context.ProjectApplications
                .AsNoTracking()
                .Include(a => a.Project!)
                    .ThenInclude(p => p.User)
                .Include(a => a.Position)
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId);

            if (application == null)
                throw new KeyNotFoundException("Application not found");

            return MapToApplicationDto(application);
        }

        public async Task WithdrawApplication(int userId, int applicationId)
        {
            var application = await _context.ProjectApplications
                .Include(a => a.Project)   // ✅ Bổ sung Include để lấy Title
                .Include(a => a.Position)  // ✅ Bổ sung Include để lấy Role
                .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId);

            if (application == null)
                throw new KeyNotFoundException("Application not found");

            if (application.Status != "pending")
                throw new InvalidOperationException("Can only withdraw pending applications");

            var projectTitle = application.Project?.Title ?? "dự án";
            var positionRole = application.Position?.Role ?? "vị trí";
            var projectId = application.ProjectId;

            _context.ProjectApplications.Remove(application);
            await _context.SaveChangesAsync();

            // ====== ✅ THÔNG BÁO ======
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "project_application",
                Title = "Đã rút đơn ứng tuyển",
                Content = $"Bạn đã rút đơn ứng tuyển vị trí \"{positionRole}\" trong dự án \"{projectTitle}\" thành công.",
                Data = $"{{\"projectId\": {projectId}}}"
            });
        }

        #endregion

        #region OWNER: MANAGE APPLICATIONS

        public async Task<List<ProjectApplicationDto>> GetProjectApplications(int userId, int projectId, int? positionId, string? status, int page, int pageSize)
        {
            await VerifyProjectOwnership(userId, projectId);

            var query = _context.ProjectApplications
                .AsNoTracking()
                .Where(a => a.ProjectId == projectId);

            if (positionId.HasValue)
                query = query.Where(a => a.PositionId == positionId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            var applications = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.Position)
                .Include(a => a.User)
                    .ThenInclude(u => u!.UserSkills)
                        .ThenInclude(us => us.Skill)
                .ToListAsync();

            return applications.Select(a => MapToApplicationDtoWithApplicant(a)).ToList();
        }

        public async Task<ProjectApplicationDto> GetApplicationDetail(int userId, int applicationId)
        {
            var application = await _context.ProjectApplications
                .AsNoTracking()
                .Include(a => a.Project)
                .Include(a => a.Position)
                .Include(a => a.User)
                    .ThenInclude(u => u!.UserSkills)
                        .ThenInclude(us => us.Skill)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                throw new KeyNotFoundException("Application not found");

            if (application.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            return MapToApplicationDtoWithApplicant(application);
        }

        public async Task<ProjectApplicationDto> AcceptApplication(int userId, int applicationId)
        {
            var application = await _context.ProjectApplications
                .Include(a => a.Project)
                .Include(a => a.Position)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                throw new KeyNotFoundException("Application not found");

            if (application.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            if (application.Status != "pending")
                throw new InvalidOperationException("Can only accept pending applications");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                application.Status = "accepted";
                application.UpdatedAt = DateTime.Now;

                var member = new ProjectMember
                {
                    ProjectId = application.ProjectId,
                    UserId = application.UserId,
                    PositionId = application.PositionId,
                    RoleType = "member",
                    Status = "active",
                    JoinedAt = DateOnly.FromDateTime(DateTime.Now)
                };
                _context.ProjectMembers.Add(member);

                var currentMembers = await _context.ProjectMembers
                    .CountAsync(m => m.PositionId == application.PositionId && m.Status == "active");

                // FIX: Quantity la int (non-nullable), dung truc tiep
                int positionQuantity = application.Position!.Quantity;
                if (currentMembers >= positionQuantity)
                {
                    application.Position.Status = "filled";
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // ====== ✅ THÔNG BÁO ======
                await _notificationService.CreateNotification(new CreateNotificationRequest
                {
                    UserId = application.UserId,
                    Type = "project_application_status",
                    Title = "Được nhận vào dự án! 🎊",
                    Content = $"Tuyệt vời! Bạn đã được chấp nhận làm \"{application.Position!.Role}\" trong dự án \"{application.Project!.Title}\". Hãy vào chào hỏi đồng đội nhé!",
                    Data = $"{{\"projectId\": {application.ProjectId}, \"applicationId\": {applicationId}, \"status\": \"accepted\"}}"
                });

                return await GetApplicationDtoById(applicationId);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ProjectApplicationDto> RejectApplication(int userId, int applicationId)
        {
            var application = await _context.ProjectApplications
                .Include(a => a.Project)
                .Include(a => a.Position) // ✅ Bổ sung Include để lấy Role
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                throw new KeyNotFoundException("Application not found");

            if (application.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            if (application.Status != "pending")
                throw new InvalidOperationException("Can only reject pending applications");

            application.Status = "rejected";
            application.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            // ====== ✅ THÔNG BÁO ======
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = application.UserId,
                Type = "project_application_status",
                Title = "Kết quả ứng tuyển dự án",
                Content = $"Rất tiếc, hồ sơ của bạn cho vị trí \"{application.Position!.Role}\" trong dự án \"{application.Project!.Title}\" chưa phù hợp lần này.",
                Data = $"{{\"projectId\": {application.ProjectId}, \"applicationId\": {applicationId}, \"status\": \"rejected\"}}"
            });

            return await GetApplicationDtoById(applicationId);
        }

        #endregion

        #region MEMBER MANAGEMENT

        public async Task<List<ProjectMemberDto>> GetProjectMembers(int projectId, string? status)
        {
            var query = _context.ProjectMembers
                .AsNoTracking()
                .Where(m => m.ProjectId == projectId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(m => m.Status == status);

            var members = await query
                .Include(m => m.User)
                .Include(m => m.Position)
                .OrderBy(m => m.JoinedAt)
                .ToListAsync();

            return members.Select(m => new ProjectMemberDto
            {
                Id = m.Id,
                ProjectId = m.ProjectId,
                UserId = m.UserId,
                PositionId = m.PositionId,
                RoleType = m.RoleType,
                Status = m.Status,
                // FIX: JoinedAt la DateOnly (non-nullable)
                JoinedAt = m.JoinedAt,
                // LeftAt la DateOnly? (nullable) - giu nguyen
                LeftAt = m.LeftAt,
                User = new UserBasicDto
                {
                    Id = m.User!.Id,
                    FullName = m.User.FullName ?? "",
                    Avatar = m.User.Avatar,
                    JobTitle = m.User.JobTitle
                },
                Position = m.Position != null ? new PositionBasicDto
                {
                    Id = m.Position.Id,
                    Role = m.Position.Role,
                    Status = m.Position.Status
                } : null
            }).ToList();
        }

        public async Task RemoveMember(int userId, int memberId)
        {
            var member = await _context.ProjectMembers
                .Include(m => m.Project)
                .Include(m => m.Position) // ✅ Bổ sung Include để lấy Role
                .FirstOrDefaultAsync(m => m.Id == memberId);

            if (member == null)
                throw new KeyNotFoundException("Member not found");

            if (member.Project!.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission");

            if (member.RoleType == "founder")
                throw new InvalidOperationException("Cannot remove founder from project");

            member.Status = "removed";
            member.LeftAt = DateOnly.FromDateTime(DateTime.Now);

            await _context.SaveChangesAsync();

            // ====== ✅ THÔNG BÁO ======
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = member.UserId,
                Type = "project_member_removed",
                Title = "Đã rời dự án 👋",
                Content = $"Bạn đã ngừng tham gia vị trí \"{member.Position?.Role ?? "thành viên"}\" trong dự án \"{member.Project!.Title}\".",
                Data = $"{{\"projectId\": {member.ProjectId}}}"
            });
        }

        public async Task LeaveProject(int userId, int projectId)
        {
            var member = await _context.ProjectMembers
                .Include(m => m.Project)  // ✅ Bổ sung Include để lấy Project
                .Include(m => m.User)     // ✅ Bổ sung Include để lấy User Name
                .Include(m => m.Position) // ✅ Bổ sung Include để lấy Role
                .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId && m.Status == "active");

            if (member == null)
                throw new KeyNotFoundException("You are not a member of this project");

            if (member.RoleType == "founder")
                throw new InvalidOperationException("Founder cannot leave the project. Please transfer ownership or delete the project.");

            member.Status = "left";
            member.LeftAt = DateOnly.FromDateTime(DateTime.Now);

            await _context.SaveChangesAsync();

            // ====== ✅ THÔNG BÁO ======
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = member.Project!.UserId, // Báo cho Leader biết
                Type = "project_member_left",
                Title = "Một đồng đội đã rời đi 🏃",
                Content = $"Thành viên \"{member.User?.FullName ?? "Ai đó"}\" (vị trí {member.Position?.Role ?? "thành viên"}) đã rời khỏi dự án \"{member.Project.Title}\".",
                Data = $"{{\"projectId\": {projectId}}}"
            });
        }

        #endregion

        #region SEARCH & DISCOVERY
        // ... (Giữ nguyên các hàm SearchProjects, GetFeaturedProjects) ...
        public async Task<(List<ProjectListDto> Projects, int TotalCount)> SearchProjects(ProjectSearchFilters filters)
        {
            var query = _context.Projects
                .AsNoTracking()
                .Where(p => p.Status == "open");

            if (!string.IsNullOrEmpty(filters.Keyword))
            {
                var keyword = filters.Keyword.ToLower();
                query = query.Where(p =>
                    p.Title.ToLower().Contains(keyword) ||
                    p.Description.ToLower().Contains(keyword));
            }

            if (!string.IsNullOrEmpty(filters.Type))
                query = query.Where(p => p.Type == filters.Type);

            if (!string.IsNullOrEmpty(filters.LocationType))
                query = query.Where(p => p.LocationType == filters.LocationType);

            if (!string.IsNullOrEmpty(filters.CompensationType))
                query = query.Where(p => p.CompensationType == filters.CompensationType);

            if (!string.IsNullOrEmpty(filters.Status))
                query = query.Where(p => p.Status == filters.Status);

            if (filters.SkillIds != null && filters.SkillIds.Any())
            {
                query = query.Where(p => p.ProjectPositions.Any(pos =>
                    pos.ProjectPositionSkills.Any(s => filters.SkillIds.Contains(s.SkillId))));
            }

            var totalCount = await query.CountAsync();

            var projects = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((filters.Page - 1) * filters.PageSize)
                .Take(filters.PageSize)
                .Include("User")
                .ToListAsync();

            var projectDtos = projects.Select(p => new ProjectListDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                Type = p.Type,
                LocationType = p.LocationType,
                CompensationType = p.CompensationType,
                Status = p.Status,
                // FIX: non-nullable
                Views = p.Views,
                CreatedAt = p.CreatedAt,
                Owner = new UserBasicDto
                {
                    Id = p.User!.Id,
                    FullName = p.User.FullName ?? "",
                    Avatar = p.User.Avatar,
                    JobTitle = p.User.JobTitle
                },
                OpenPositions = _context.ProjectPositions.Count(pos => pos.ProjectId == p.Id && pos.Status == "open"),
                TotalApplications = _context.ProjectApplications.Count(a => a.ProjectId == p.Id)
            }).ToList();

            return (projectDtos, totalCount);
        }

        public async Task<List<ProjectListDto>> GetFeaturedProjects(int count)
        {
            var projects = await _context.Projects
                .AsNoTracking()
                .Where(p => p.Status == "open")
                .OrderByDescending(p => p.Views)
                .ThenByDescending(p => p.CreatedAt)
                .Take(count)
                .Include("User")
                .ToListAsync();

            return projects.Select(p => new ProjectListDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                Type = p.Type,
                LocationType = p.LocationType,
                CompensationType = p.CompensationType,
                Status = p.Status,
                // FIX: non-nullable
                Views = p.Views,
                CreatedAt = p.CreatedAt,
                Owner = new UserBasicDto
                {
                    Id = p.User!.Id,
                    FullName = p.User.FullName ?? "",
                    Avatar = p.User.Avatar,
                    JobTitle = p.User.JobTitle
                },
                OpenPositions = _context.ProjectPositions.Count(pos => pos.ProjectId == p.Id && pos.Status == "open"),
                TotalApplications = _context.ProjectApplications.Count(a => a.ProjectId == p.Id)
            }).ToList();
        }
        #endregion

        #region HELPER METHODS
        // ... (Giữ nguyên toàn bộ Helper Methods) ...
        private async Task<Project> VerifyProjectOwnership(int userId, int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                throw new KeyNotFoundException("Project not found");

            if (project.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to access this project");

            return project;
        }

        private async Task<ProjectStatsDto> GetStatsForProject(int projectId)
        {
            var positions = await _context.ProjectPositions
                .Where(p => p.ProjectId == projectId)
                .ToListAsync();

            var applications = await _context.ProjectApplications
                .Where(a => a.ProjectId == projectId)
                .ToListAsync();

            var members = await _context.ProjectMembers
                .Where(m => m.ProjectId == projectId)
                .ToListAsync();

            var project = await _context.Projects.FindAsync(projectId);

            return new ProjectStatsDto
            {
                TotalPositions = positions.Count,
                OpenPositions = positions.Count(p => p.Status == "open"),
                FilledPositions = positions.Count(p => p.Status == "filled"),
                TotalApplications = applications.Count,
                PendingApplications = applications.Count(a => a.Status == "pending"),
                AcceptedApplications = applications.Count(a => a.Status == "accepted"),
                RejectedApplications = applications.Count(a => a.Status == "rejected"),
                TotalMembers = members.Count,
                ActiveMembers = members.Count(m => m.Status == "active"),
                // FIX: Views la int (non-nullable)
                Views = project != null ? project.Views : 0
            };
        }

        private async Task<PositionDto> GetPositionDtoById(int positionId)
        {
            var position = await _context.ProjectPositions
                .AsNoTracking()
                .Include(p => p.ProjectPositionSkills)
                    .ThenInclude(s => s.Skill)
                .FirstOrDefaultAsync(p => p.Id == positionId);

            if (position == null)
                throw new KeyNotFoundException("Position not found");

            return new PositionDto
            {
                Id = position.Id,
                ProjectId = position.ProjectId,
                Role = position.Role,
                // FIX: non-nullable
                Quantity = position.Quantity,
                Requirements = position.Requirements,
                Status = position.Status,
                CreatedAt = position.CreatedAt,
                Skills = position.ProjectPositionSkills.Select(s => new PositionSkillDto
                {
                    SkillId = s.SkillId,
                    SkillName = s.Skill!.Name,
                    IsRequired = s.IsRequired
                }).ToList(),
                TotalApplications = await _context.ProjectApplications.CountAsync(a => a.PositionId == positionId),
                CurrentMembers = await _context.ProjectMembers.CountAsync(m => m.PositionId == positionId && m.Status == "active")
            };
        }

        private async Task<ProjectApplicationDto> GetApplicationDtoById(int applicationId)
        {
            var application = await _context.ProjectApplications
                .AsNoTracking()
                .Include(a => a.Project!)
                    .ThenInclude(p => p.User)
                .Include(a => a.Position)
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
                throw new KeyNotFoundException("Application not found");

            return MapToApplicationDto(application);
        }

        private ProjectApplicationDto MapToApplicationDto(ProjectApplication application)
        {
            return new ProjectApplicationDto
            {
                Id = application.Id,
                ProjectId = application.ProjectId,
                PositionId = application.PositionId,
                UserId = application.UserId,
                CoverLetter = application.CoverLetter,
                PortfolioLink = application.PortfolioLink,
                Status = application.Status,
                // FIX: AppliedAt, UpdatedAt la DateTime (non-nullable)
                AppliedAt = application.AppliedAt,
                UpdatedAt = application.UpdatedAt,
                Project = new ProjectBasicDto
                {
                    Id = application.Project!.Id,
                    Title = application.Project.Title,
                    Type = application.Project.Type,
                    Status = application.Project.Status,
                    Owner = new UserBasicDto
                    {
                        Id = application.Project.User!.Id,
                        FullName = application.Project.User.FullName ?? "",
                        Avatar = application.Project.User.Avatar,
                        JobTitle = application.Project.User.JobTitle
                    }
                },
                Position = new PositionBasicDto
                {
                    Id = application.Position!.Id,
                    Role = application.Position.Role,
                    Status = application.Position.Status
                }
            };
        }

        private ProjectApplicationDto MapToApplicationDtoWithApplicant(ProjectApplication application)
        {
            return new ProjectApplicationDto
            {
                Id = application.Id,
                ProjectId = application.ProjectId,
                PositionId = application.PositionId,
                UserId = application.UserId,
                CoverLetter = application.CoverLetter,
                PortfolioLink = application.PortfolioLink,
                Status = application.Status,
                // FIX: AppliedAt, UpdatedAt la DateTime (non-nullable)
                AppliedAt = application.AppliedAt,
                UpdatedAt = application.UpdatedAt,
                Position = new PositionBasicDto
                {
                    Id = application.Position!.Id,
                    Role = application.Position.Role,
                    Status = application.Position.Status
                },
                Applicant = new ApplicantDto
                {
                    Id = application.User!.Id,
                    FullName = application.User.FullName ?? "",
                    Email = application.User.Email,
                    Avatar = application.User.Avatar,
                    JobTitle = application.User.JobTitle,
                    Phone = application.User.Phone,
                    Skills = application.User.UserSkills.Select(us => new UserSkillBasicDto
                    {
                        SkillName = us.Skill!.Name,
                        Level = us.Level,
                        YearsExperience = us.YearsExperience
                    }).ToList()
                }
            };
        }

        #endregion
    }
}