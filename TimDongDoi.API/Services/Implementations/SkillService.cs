using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Skill;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations
{
    public class SkillService : ISkillService
    {
        private readonly AppDbContext _context;

        public SkillService(AppDbContext context)
        {
            _context = context;
        }

        // ===== QUẢN LÝ SKILLS HỆ THỐNG =====
        
        public async Task<List<SkillDto>> GetAllSkills()
        {
            return await _context.Skills
                .OrderByDescending(s => s.Popularity)
                .Select(s => new SkillDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Category = s.Category,
                    Icon = s.Icon,
                    Popularity = s.Popularity ?? 0
                })
                .ToListAsync();
        }

        public async Task<List<SkillDto>> SearchSkills(string query)
        {
            return await _context.Skills
                .Where(s => s.Name.Contains(query))
                .OrderByDescending(s => s.Popularity)
                .Select(s => new SkillDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Category = s.Category,
                    Icon = s.Icon,
                    Popularity = s.Popularity ?? 0
                })
                .Take(20)
                .ToListAsync();
        }

        public async Task<SkillDto> CreateSkill(string name, string? category, string? icon)
        {
            // Kiểm tra trùng
            if (await _context.Skills.AnyAsync(s => s.Name == name))
            {
                throw new InvalidOperationException("Skill đã tồn tại.");
            }

            var skill = new Skill
            {
                Name = name,
                Category = category,
                Icon = icon,
                Popularity = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Skills.Add(skill);
            await _context.SaveChangesAsync();

            return new SkillDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category,
                Icon = skill.Icon,
                Popularity = skill.Popularity ?? 0
            };
        }

        // ===== QUẢN LÝ USER SKILLS =====

        public async Task<List<UserSkillDto>> GetUserSkills(int userId)
        {
            return await _context.UserSkills
                .Where(us => us.UserId == userId)
                .Include(us => us.Skill)
                .Select(us => new UserSkillDto
                {
                    Id = us.Id,
                    SkillId = us.SkillId,
                    SkillName = us.Skill.Name,
                    Category = us.Skill.Category,
                    Icon = us.Skill.Icon,
                    Level = us.Level ?? "beginner",
                    YearsExperience = us.YearsExperience,
                    Description = us.Description,
                    CreatedAt = us.CreatedAt ?? DateTime.UtcNow
                })
                .ToListAsync();
        }

        public async Task<UserSkillDto> AddUserSkill(int userId, AddUserSkillRequest request)
        {
            // Kiểm tra skill tồn tại
            var skill = await _context.Skills.FindAsync(request.SkillId);
            if (skill == null)
            {
                throw new KeyNotFoundException("Skill không tồn tại.");
            }

            // Kiểm tra user đã có skill này chưa
            if (await _context.UserSkills.AnyAsync(us => us.UserId == userId && us.SkillId == request.SkillId))
            {
                throw new InvalidOperationException("Bạn đã có skill này rồi.");
            }

            var userSkill = new UserSkill
            {
                UserId = userId,
                SkillId = request.SkillId,
                Level = request.Level,
                YearsExperience = request.YearsExperience,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserSkills.Add(userSkill);
            
            // Tăng popularity
            skill.Popularity = (skill.Popularity ?? 0) + 1;
            
            await _context.SaveChangesAsync();

            return new UserSkillDto
            {
                Id = userSkill.Id,
                SkillId = skill.Id,
                SkillName = skill.Name,
                Category = skill.Category,
                Icon = skill.Icon,
                Level = userSkill.Level ?? "beginner",
                YearsExperience = userSkill.YearsExperience,
                Description = userSkill.Description,
                CreatedAt = userSkill.CreatedAt ?? DateTime.UtcNow
            };
        }

        public async Task<UserSkillDto> UpdateUserSkill(int userId, int userSkillId, UpdateUserSkillRequest request)
        {
            var userSkill = await _context.UserSkills
                .Include(us => us.Skill)
                .FirstOrDefaultAsync(us => us.Id == userSkillId && us.UserId == userId);

            if (userSkill == null)
            {
                throw new KeyNotFoundException("Không tìm thấy skill.");
            }

            userSkill.Level = request.Level;
            userSkill.YearsExperience = request.YearsExperience;
            userSkill.Description = request.Description;
            userSkill.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new UserSkillDto
            {
                Id = userSkill.Id,
                SkillId = userSkill.SkillId,
                SkillName = userSkill.Skill.Name,
                Category = userSkill.Skill.Category,
                Icon = userSkill.Skill.Icon,
                Level = userSkill.Level ?? "beginner",
                YearsExperience = userSkill.YearsExperience,
                Description = userSkill.Description,
                CreatedAt = userSkill.CreatedAt ?? DateTime.UtcNow
            };
        }

        public async Task DeleteUserSkill(int userId, int userSkillId)
        {
            var userSkill = await _context.UserSkills
                .FirstOrDefaultAsync(us => us.Id == userSkillId && us.UserId == userId);

            if (userSkill == null)
            {
                throw new KeyNotFoundException("Không tìm thấy skill.");
            }

            _context.UserSkills.Remove(userSkill);
            await _context.SaveChangesAsync();
        }
    }
}