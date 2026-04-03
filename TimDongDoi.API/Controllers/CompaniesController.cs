using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Company;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers
{
    /// <summary>
    /// Controller quản lý công ty - Module E
    /// </summary>
    [Route("api/companies")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public CompaniesController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        // Helper method để lấy UserId từ JWT token
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        // ============================================
        // UC20: QUẢN LÝ THÔNG TIN CÔNG TY (CRUD)
        // ============================================

        /// <summary>
        /// [GET] /api/companies/me - Lấy thông tin công ty của mình
        /// </summary>
        [HttpGet("me")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> GetMyCompany()
        {
            try
            {
                var userId = GetCurrentUserId();
                var company = await _companyService.GetMyCompany(userId);

                return Ok(new { Success = true, Data = company });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [GET] /api/companies/{id} - Xem công ty công khai
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyById(int id)
        {
            try
            {
                var company = await _companyService.GetCompanyById(id);
                return Ok(new { Success = true, Data = company });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [POST] /api/companies - Tạo thông tin công ty
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var company = await _companyService.CreateCompany(userId, request);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Tạo thông tin công ty thành công",
                    Data = company
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [PUT] /api/companies/me - Cập nhật thông tin công ty
        /// </summary>
        [HttpPut("me")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> UpdateCompany([FromBody] UpdateCompanyRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var company = await _companyService.UpdateCompany(userId, request);

                return Ok(new
                {
                    Success = true,
                    Message = "Cập nhật thông tin công ty thành công",
                    Data = company
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [DELETE] /api/companies/me - Xóa thông tin công ty
        /// </summary>
        [HttpDelete("me")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> DeleteCompany()
        {
            try
            {
                var userId = GetCurrentUserId();
                await _companyService.DeleteCompany(userId);

                return Ok(new
                {
                    Success = true,
                    Message = "Xóa thông tin công ty thành công"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // UC21: UPLOAD LOGO/ẢNH CÔNG TY
        // ============================================

        /// <summary>
        /// [POST] /api/companies/me/logo - Upload logo
        /// </summary>
        [HttpPost("me/logo")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> UploadLogo(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { Success = false, Message = "File không được để trống" });
                }

                var userId = GetCurrentUserId();
                var result = await _companyService.UploadLogo(userId, file);

                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [POST] /api/companies/me/images - Upload ảnh công ty
        /// </summary>
        [HttpPost("me/images")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { Success = false, Message = "File không được để trống" });
                }

                var userId = GetCurrentUserId();
                var result = await _companyService.UploadImage(userId, file);

                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // UC22: XÁC MINH DOANH NGHIỆP
        // ============================================

        /// <summary>
        /// [POST] /api/companies/me/verification - Gửi yêu cầu xác minh
        /// </summary>
        [HttpPost("me/verification")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> SubmitVerification([FromForm] SubmitVerificationRequest request, IFormFile document)
        {
            try
            {
                if (document == null || document.Length == 0)
                {
                    return BadRequest(new { Success = false, Message = "File giấy tờ là bắt buộc" });
                }

                var userId = GetCurrentUserId();
                var result = await _companyService.SubmitVerification(userId, request, document);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Gửi yêu cầu xác minh thành công. Chúng tôi sẽ xem xét trong 1-3 ngày làm việc.",
                    Data = result
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [GET] /api/companies/me/verifications - Xem trạng thái xác minh của mình
        /// </summary>
        [HttpGet("me/verifications")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> GetMyVerifications()
        {
            try
            {
                var userId = GetCurrentUserId();
                var verifications = await _companyService.GetMyVerifications(userId);

                return Ok(new { Success = true, Data = verifications });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // QUẢN LÝ ĐỊA ĐIỂM
        // ============================================

        /// <summary>
        /// [GET] /api/companies/{id}/locations - Lấy danh sách địa điểm
        /// </summary>
        [HttpGet("{id}/locations")]
        public async Task<IActionResult> GetCompanyLocations(int id)
        {
            try
            {
                var locations = await _companyService.GetCompanyLocations(id);
                return Ok(new { Success = true, Data = locations });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [POST] /api/companies/me/locations - Thêm địa điểm mới
        /// </summary>
        [HttpPost("me/locations")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> AddLocation([FromBody] AddLocationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var location = await _companyService.AddLocation(userId, request);

                return StatusCode(201, new
                {
                    Success = true,
                    Message = "Thêm địa điểm thành công",
                    Data = location
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [PUT] /api/companies/me/locations/{locationId} - Cập nhật địa điểm
        /// </summary>
        [HttpPut("me/locations/{locationId}")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> UpdateLocation(int locationId, [FromBody] UpdateLocationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var location = await _companyService.UpdateLocation(userId, locationId, request);

                return Ok(new
                {
                    Success = true,
                    Message = "Cập nhật địa điểm thành công",
                    Data = location
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// [DELETE] /api/companies/me/locations/{locationId} - Xóa địa điểm
        /// </summary>
        [HttpDelete("me/locations/{locationId}")]
        [Authorize(Roles = "company")]
        public async Task<IActionResult> DeleteLocation(int locationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _companyService.DeleteLocation(userId, locationId);

                return Ok(new
                {
                    Success = true,
                    Message = "Xóa địa điểm thành công"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // ============================================
        // SEARCH & FILTER (PUBLIC)
        // ============================================

        /// <summary>
        /// [GET] /api/companies - Tìm kiếm công ty
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> SearchCompanies(
            [FromQuery] string? keyword,
            [FromQuery] string? industry,
            [FromQuery] string? size,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var companies = await _companyService.SearchCompanies(keyword, industry, size, page, pageSize);
                return Ok(new
                {
                    Success = true,
                    Data = companies,
                    Page = page,
                    PageSize = pageSize,
                    Total = companies.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }
    }
}