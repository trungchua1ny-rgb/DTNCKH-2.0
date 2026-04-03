namespace TimDongDoi.API.DTOs.User
{
    public class UserEducationDto
    {
        public int Id { get; set; }
        public string? SchoolName { get; set; }
        public string? Major { get; set; }
        public string? Degree { get; set; }
        public int? StartYear { get; set; }
        public int? EndYear { get; set; }
        public string? Description { get; set; }
    }

    public class UserEducationRequest
    {
        public string? SchoolName { get; set; }
        public string? Major { get; set; }
        public string? Degree { get; set; }
        public int? StartYear { get; set; }
        public int? EndYear { get; set; }
        public string? Description { get; set; }
    }
}