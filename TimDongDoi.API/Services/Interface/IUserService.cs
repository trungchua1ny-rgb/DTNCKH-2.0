using TimDongDoi.API.DTOs.User;
using System.Threading.Tasks; 
using System;

namespace TimDongDoi.API.Services.Interfaces
{
    public interface IUserService
    {
        // Lấy hồ sơ người dùng 
        Task<UserProfileDto> GetUserProfile(int userId);

        // Cập nhật hồ sơ
        Task<UserProfileDto> UpdateUserProfile(int userId, UserUpdateDto updateDto);
        Task ChangePassword(int userId, ChangePasswordDto dto);

        // Lấy ID người dùng từ JWT Token
        int GetUserIdFromClaims();
    }
}