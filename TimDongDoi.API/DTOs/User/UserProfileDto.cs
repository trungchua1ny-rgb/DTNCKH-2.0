using System;
using System.Collections.Generic;

namespace TimDongDoi.API.DTOs.User
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        
        // Thông tin hồ sơ
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
        public string? AboutMe { get; set; }
        public string? Address { get; set; }
        public DateTime? Birthday { get; set; } 
        public string? Gender { get; set; }
        public string? JobTitle { get; set; } 
        public int? SalaryExpectation { get; set; }
        public string? CvFile { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Danh sách liên quan
        public List<UserSkillDto> Skills { get; set; } = new List<UserSkillDto>();
        public List<UserExperienceDto> Experiences { get; set; } = new List<UserExperienceDto>();
        public List<UserEducationDto> Educations { get; set; } = new List<UserEducationDto>();
    }
}