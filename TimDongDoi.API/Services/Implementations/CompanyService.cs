using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Data;
using TimDongDoi.API.DTOs.Company;
using TimDongDoi.API.DTOs.Notification;
using TimDongDoi.API.Models;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Services.Implementations
{
    public class CompanyService : ICompanyService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly INotificationService _notificationService;

        public CompanyService(AppDbContext context, IWebHostEnvironment env, INotificationService notificationService)
        {
            _context = context;
            _env = env;
            _notificationService = notificationService;
        }

        // ============================================
        // UC20: QUẢN LÝ THÔNG TIN CÔNG TY (CRUD)
        // ============================================

        public async Task<CompanyDetailDto> GetMyCompany(int userId)
        {
            var company = await _context.Companies
                .Include(c => c.User)
                .Include(c => c.CompanyLocations)
                .Include(c => c.Jobs)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty. Vui lòng tạo thông tin công ty trước.");

            return MapToDetailDto(company);
        }

        public async Task<CompanyDetailDto> GetCompanyById(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.User)
                .Include(c => c.CompanyLocations)
                .Include(c => c.Jobs)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == companyId)
                ?? throw new KeyNotFoundException("Không tìm thấy công ty");

            return MapToDetailDto(company);
        }

        public async Task<CompanyDetailDto> CreateCompany(int userId, CreateCompanyRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.Role != "company")
                throw new UnauthorizedAccessException("Chỉ tài khoản Company mới có thể tạo thông tin công ty");

            var existingCompany = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId);
            if (existingCompany != null)
                throw new InvalidOperationException("Bạn đã có thông tin công ty. Vui lòng cập nhật thay vì tạo mới.");

            var newCompany = new Company
            {
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                Website = request.Website,
                Industry = request.Industry,
                Size = request.Size,
                FoundedYear = request.FoundedYear,
                VerificationStatus = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(newCompany);
            await _context.SaveChangesAsync();

            // Thông báo tạo công ty thành công
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "system",
                Title = "Hồ sơ công ty đã được tạo! 🏢",
                Content = $"Hồ sơ công ty \"{request.Name}\" đã được tạo thành công. Hãy gửi yêu cầu xác minh để tăng độ tin cậy.",
                Data = $"{{\"companyId\": {newCompany.Id}}}"
            });

            return await GetMyCompany(userId);
        }

        public async Task<CompanyDetailDto> UpdateCompany(int userId, UpdateCompanyRequest request)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            company.Name = request.Name;
            company.Description = request.Description;
            company.Website = request.Website;
            company.Industry = request.Industry;
            company.Size = request.Size;
            company.FoundedYear = request.FoundedYear;
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetMyCompany(userId);
        }

        public async Task DeleteCompany(int userId)
        {
            var company = await _context.Companies
                .Include(c => c.Jobs)
                .FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            var hasActiveJobs = company.Jobs.Any(j => j.Status == "active");
            if (hasActiveJobs)
                throw new InvalidOperationException("Không thể xóa công ty khi còn tin tuyển dụng đang hoạt động.");

            if (!string.IsNullOrEmpty(company.Logo))
                DeleteFile(company.Logo);

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
        }

        // ============================================
        // UC21: UPLOAD LOGO/ẢNH CÔNG TY
        // ============================================

        public async Task<UploadFileResponse> UploadLogo(int userId, IFormFile file)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            ValidateImageFile(file, 5);

            var fileName = $"logo_{company.Id}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var fileUrl = await SaveFile(file, "logos", fileName);

            if (!string.IsNullOrEmpty(company.Logo))
                DeleteFile(company.Logo);

            company.Logo = fileUrl;
            company.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new UploadFileResponse
            {
                Success = true,
                Url = fileUrl,
                FileName = fileName,
                FileSize = file.Length,
                Message = "Upload logo thành công"
            };
        }

        public async Task<UploadFileResponse> UploadImage(int userId, IFormFile file)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            ValidateImageFile(file, 10);

            var fileName = $"company_{company.Id}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var fileUrl = await SaveFile(file, "company-images", fileName);

            return new UploadFileResponse
            {
                Success = true,
                Url = fileUrl,
                FileName = fileName,
                FileSize = file.Length,
                Message = "Upload ảnh thành công"
            };
        }

        // ============================================
        // UC22: XÁC MINH DOANH NGHIỆP
        // ============================================

        public async Task<CompanyVerificationDto> SubmitVerification(int userId, SubmitVerificationRequest request, IFormFile document)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(document.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                throw new InvalidOperationException("Chỉ chấp nhận file PDF hoặc ảnh (.pdf, .jpg, .jpeg, .png)");

            if (document.Length > 10 * 1024 * 1024)
                throw new InvalidOperationException("Kích thước file không được vượt quá 10MB");

            var fileName = $"verification_{company.Id}_{Guid.NewGuid()}{extension}";
            var documentUrl = await SaveFile(document, "verifications", fileName);

            var verification = new CompanyVerification
            {
                CompanyId = company.Id,
                DocumentType = request.DocumentType,
                DocumentUrl = documentUrl,
                Status = "pending",
                Notes = request.Notes,
                SubmittedAt = DateTime.UtcNow
            };

            _context.CompanyVerifications.Add(verification);
            await _context.SaveChangesAsync();

            // Thông báo cho company đã gửi yêu cầu xác minh
            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = userId,
                Type = "system",
                Title = "Yêu cầu xác minh đã được gửi 📋",
                Content = $"Yêu cầu xác minh doanh nghiệp \"{company.Name}\" đã được gửi thành công. Vui lòng chờ admin xem xét (thường 1-3 ngày làm việc).",
                Data = $"{{\"companyId\": {company.Id}, \"verificationId\": {verification.Id}}}"
            });

            return new CompanyVerificationDto
            {
                Id = verification.Id,
                CompanyId = verification.CompanyId,
                CompanyName = company.Name,
                DocumentType = verification.DocumentType ?? "",
                DocumentUrl = verification.DocumentUrl,
                Status = verification.Status ?? "pending",
                Notes = verification.Notes,
                SubmittedAt = verification.SubmittedAt
            };
        }

        public async Task<List<CompanyVerificationDto>> GetMyVerifications(int userId)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            var verifications = await _context.CompanyVerifications
                .Include(v => v.VerifiedByNavigation)
                .Where(v => v.CompanyId == company.Id)
                .OrderByDescending(v => v.SubmittedAt)
                .AsNoTracking()
                .ToListAsync();

            return verifications.Select(v => new CompanyVerificationDto
            {
                Id = v.Id,
                CompanyId = v.CompanyId,
                CompanyName = company.Name,
                VerifiedBy = v.VerifiedBy,
                VerifiedByName = v.VerifiedByNavigation?.FullName,
                DocumentType = v.DocumentType ?? "",
                DocumentUrl = v.DocumentUrl,
                Status = v.Status ?? "pending",
                Notes = v.Notes,
                SubmittedAt = v.SubmittedAt,
                VerifiedAt = v.VerifiedAt
            }).ToList();
        }

        public async Task<List<CompanyVerificationDto>> GetPendingVerifications(int page = 1, int pageSize = 20)
        {
            var verifications = await _context.CompanyVerifications
                .Include(v => v.Company)
                .Include(v => v.VerifiedByNavigation)
                .Where(v => v.Status == "pending")
                .OrderBy(v => v.SubmittedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return verifications.Select(v => new CompanyVerificationDto
            {
                Id = v.Id,
                CompanyId = v.CompanyId,
                CompanyName = v.Company.Name,
                VerifiedBy = v.VerifiedBy,
                VerifiedByName = v.VerifiedByNavigation?.FullName,
                DocumentType = v.DocumentType ?? "",
                DocumentUrl = v.DocumentUrl,
                Status = v.Status ?? "pending",
                Notes = v.Notes,
                SubmittedAt = v.SubmittedAt,
                VerifiedAt = v.VerifiedAt
            }).ToList();
        }

        public async Task<CompanyVerificationDto> ProcessVerification(int adminUserId, int verificationId, ProcessVerificationRequest request)
        {
            var verification = await _context.CompanyVerifications
                .Include(v => v.Company)
                .FirstOrDefaultAsync(v => v.Id == verificationId)
                ?? throw new KeyNotFoundException("Không tìm thấy yêu cầu xác minh");

            if (verification.Status != "pending")
                throw new InvalidOperationException("Yêu cầu này đã được xử lý");

            var action = request.Action.ToLower();
            if (action != "approve" && action != "reject")
                throw new InvalidOperationException("Action phải là 'approve' hoặc 'reject'.");

            verification.Status = action == "approve" ? "approved" : "rejected";
            verification.VerifiedBy = adminUserId;
            verification.VerifiedAt = DateTime.UtcNow;
            verification.Notes = request.Notes;

            if (verification.Status == "approved")
                verification.Company.VerificationStatus = "verified";
            else
                verification.Company.VerificationStatus = "rejected";

            await _context.SaveChangesAsync();

            // Thông báo kết quả xác minh cho company
            var (title, content) = action == "approve"
                ? ("Doanh nghiệp đã được xác minh! ✅",
                   $"Chúc mừng! Doanh nghiệp \"{verification.Company.Name}\" đã được xác minh thành công. Hồ sơ của bạn sẽ hiển thị dấu tick xác minh.")
                : ("Yêu cầu xác minh bị từ chối ❌",
                   $"Rất tiếc, yêu cầu xác minh doanh nghiệp \"{verification.Company.Name}\" đã bị từ chối. " +
                   (string.IsNullOrEmpty(request.Notes) ? "" : $"Lý do: {request.Notes}. ") +
                   "Vui lòng kiểm tra lại tài liệu và gửi yêu cầu mới.");

            await _notificationService.CreateNotification(new CreateNotificationRequest
            {
                UserId = verification.Company.UserId,
                Type = "system",
                Title = title,
                Content = content,
                Data = $"{{\"companyId\": {verification.CompanyId}, \"verificationId\": {verificationId}, \"status\": \"{verification.Status}\"}}"
            });

            var admin = await _context.Users.FindAsync(adminUserId);

            return new CompanyVerificationDto
            {
                Id = verification.Id,
                CompanyId = verification.CompanyId,
                CompanyName = verification.Company.Name,
                VerifiedBy = verification.VerifiedBy,
                VerifiedByName = admin?.FullName,
                DocumentType = verification.DocumentType ?? "",
                DocumentUrl = verification.DocumentUrl,
                Status = verification.Status ?? "",
                Notes = verification.Notes,
                SubmittedAt = verification.SubmittedAt,
                VerifiedAt = verification.VerifiedAt
            };
        }

        // ============================================
        // QUẢN LÝ ĐỊA ĐIỂM
        // ============================================

        public async Task<List<CompanyLocationDto>> GetCompanyLocations(int companyId)
        {
            var locations = await _context.CompanyLocations
                .Where(l => l.CompanyId == companyId)
                .OrderByDescending(l => l.IsHeadquarter)
                .ThenBy(l => l.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return locations.Select(l => new CompanyLocationDto
            {
                Id = l.Id,
                CompanyId = l.CompanyId,
                Address = l.Address ?? "",
                City = l.City,
                Country = l.Country,
                IsHeadquarter = l.IsHeadquarter ?? false,
                CreatedAt = l.CreatedAt
            }).ToList();
        }

        public async Task<CompanyLocationDto> AddLocation(int userId, AddLocationRequest request)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            if (request.IsHeadquarter)
            {
                var existingLocations = await _context.CompanyLocations
                    .Where(l => l.CompanyId == company.Id)
                    .ToListAsync();
                foreach (var loc in existingLocations)
                    loc.IsHeadquarter = false;
            }

            var newLocation = new CompanyLocation
            {
                CompanyId = company.Id,
                Address = request.Address,
                City = request.City,
                Country = request.Country ?? "Vietnam",
                IsHeadquarter = request.IsHeadquarter,
                CreatedAt = DateTime.UtcNow
            };

            _context.CompanyLocations.Add(newLocation);
            await _context.SaveChangesAsync();

            return new CompanyLocationDto
            {
                Id = newLocation.Id,
                CompanyId = newLocation.CompanyId,
                Address = newLocation.Address ?? "",
                City = newLocation.City,
                Country = newLocation.Country,
                IsHeadquarter = newLocation.IsHeadquarter ?? false,
                CreatedAt = newLocation.CreatedAt
            };
        }

        public async Task<CompanyLocationDto> UpdateLocation(int userId, int locationId, UpdateLocationRequest request)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            var location = await _context.CompanyLocations
                .FirstOrDefaultAsync(l => l.Id == locationId && l.CompanyId == company.Id)
                ?? throw new KeyNotFoundException("Không tìm thấy địa điểm");

            if (request.IsHeadquarter && !(location.IsHeadquarter ?? false))
            {
                var otherLocations = await _context.CompanyLocations
                    .Where(l => l.CompanyId == company.Id && l.Id != locationId)
                    .ToListAsync();
                foreach (var loc in otherLocations)
                    loc.IsHeadquarter = false;
            }

            location.Address = request.Address;
            location.City = request.City;
            location.Country = request.Country;
            location.IsHeadquarter = request.IsHeadquarter;

            await _context.SaveChangesAsync();

            return new CompanyLocationDto
            {
                Id = location.Id,
                CompanyId = location.CompanyId,
                Address = location.Address ?? "",
                City = location.City,
                Country = location.Country,
                IsHeadquarter = location.IsHeadquarter ?? false,
                CreatedAt = location.CreatedAt
            };
        }

        public async Task DeleteLocation(int userId, int locationId)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin công ty");

            var location = await _context.CompanyLocations
                .FirstOrDefaultAsync(l => l.Id == locationId && l.CompanyId == company.Id)
                ?? throw new KeyNotFoundException("Không tìm thấy địa điểm");

            _context.CompanyLocations.Remove(location);
            await _context.SaveChangesAsync();
        }

        // ============================================
        // SEARCH & FILTER (PUBLIC)
        // ============================================

        public async Task<List<CompanyDto>> SearchCompanies(string? keyword, string? industry, string? size, int page = 1, int pageSize = 20)
        {
            var query = _context.Companies
                .Include(c => c.Jobs)
                .Include(c => c.CompanyLocations)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(keyword) ||
                    (c.Description != null && c.Description.ToLower().Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(industry))
                query = query.Where(c => c.Industry == industry);

            if (!string.IsNullOrWhiteSpace(size))
                query = query.Where(c => c.Size == size);

            query = query.Where(c => c.VerificationStatus == "verified" || c.VerificationStatus == "pending");

            var companies = await query
                .OrderByDescending(c => c.VerificationStatus == "verified")
                .ThenByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return companies.Select(c => new CompanyDto
            {
                Id = c.Id,
                UserId = c.UserId,
                Name = c.Name,
                Logo = c.Logo,
                Industry = c.Industry,
                Size = c.Size,
                Website = c.Website,
                VerificationStatus = c.VerificationStatus ?? "pending",
                CreatedAt = c.CreatedAt,
                TotalJobs = c.Jobs.Count(j => j.Status == "active"),
                TotalLocations = c.CompanyLocations.Count
            }).ToList();
        }

        public async Task<List<CompanyDto>> GetAllCompanies(int page = 1, int pageSize = 20)
        {
            return await SearchCompanies(null, null, null, page, pageSize);
        }

        // ============================================
        // HELPER METHODS
        // ============================================

        private CompanyDetailDto MapToDetailDto(Company company)
        {
            return new CompanyDetailDto
            {
                Id = company.Id,
                UserId = company.UserId,
                Name = company.Name,
                Logo = company.Logo,
                Description = company.Description,
                Website = company.Website,
                Industry = company.Industry,
                Size = company.Size,
                FoundedYear = company.FoundedYear,
                VerificationStatus = company.VerificationStatus ?? "pending",
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt,
                Representative = company.User != null ? new UserBasicDto
                {
                    Id = company.User.Id,
                    FullName = company.User.FullName,
                    Email = company.User.Email,
                    Phone = company.User.Phone
                } : null,
                Locations = company.CompanyLocations?.Select(l => new CompanyLocationDto
                {
                    Id = l.Id,
                    CompanyId = l.CompanyId,
                    Address = l.Address ?? "",
                    City = l.City,
                    Country = l.Country,
                    IsHeadquarter = l.IsHeadquarter ?? false,
                    CreatedAt = l.CreatedAt
                }).ToList() ?? new List<CompanyLocationDto>(),
                Stats = new CompanyStatsDto
                {
                    TotalJobs = company.Jobs?.Count ?? 0,
                    ActiveJobs = company.Jobs?.Count(j => j.Status == "active") ?? 0,
                    TotalApplications = 0,
                    TotalLocations = company.CompanyLocations?.Count ?? 0
                }
            };
        }

        private void ValidateImageFile(IFormFile file, int maxSizeMB)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                throw new InvalidOperationException("Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png, .gif)");

            if (file.Length > maxSizeMB * 1024 * 1024)
                throw new InvalidOperationException($"Kích thước file không được vượt quá {maxSizeMB}MB");
        }

        private async Task<string> SaveFile(IFormFile file, string folder, string fileName)
        {
            var uploadPath = Path.Combine(_env.WebRootPath, "uploads", folder);
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            var filePath = Path.Combine(uploadPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            return $"/uploads/{folder}/{fileName}";
        }

        private void DeleteFile(string fileUrl)
        {
            try
            {
                var filePath = Path.Combine(_env.WebRootPath, fileUrl.TrimStart('/'));
                if (File.Exists(filePath))
                    File.Delete(filePath);
            }
            catch { }
        }
    }
}