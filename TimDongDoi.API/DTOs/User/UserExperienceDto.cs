namespace TimDongDoi.API.DTOs.User
{
    public class UserExperienceDto
    {
        public int Id { get; set; }
        public string? CompanyName { get; set; }
        public string? Position { get; set; }
        public string? StartDate { get; set; }  // "yyyy-MM-dd"
        public string? EndDate { get; set; }    // "yyyy-MM-dd"
        public bool IsCurrent { get; set; }
        public string? Description { get; set; }
    }

    public class UserExperienceRequest
    {
        public string? CompanyName { get; set; }
        public string? Position { get; set; }
        public string? StartDate { get; set; }  // "yyyy-MM-dd"
        public string? EndDate { get; set; }    // "yyyy-MM-dd", null nếu IsCurrent = true
        public bool IsCurrent { get; set; } = false;
        public string? Description { get; set; }
    }
}