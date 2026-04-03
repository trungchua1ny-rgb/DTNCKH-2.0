namespace TimDongDoi.API.Models
{
    public enum Gender
    {
        Male,
        Female,
        Other
    }

    public enum UserRole
    {
        Admin,
        Company,
        User
    }

    public enum UserStatus
    {
        Pending,
        Active,  // hoặc 'status' nếu DB của bạn dùng từ này
        Banned
    }
}