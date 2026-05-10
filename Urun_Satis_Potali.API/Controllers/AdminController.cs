using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Urun_Satis_Potali.API.DTOs;
using Urun_Satis_Potali.API.Repositories;

namespace Urun_Satis_Potali.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AdminRepository _adminRepository;
        private readonly IWebHostEnvironment _env;

        public AdminController(AdminRepository adminRepository, IWebHostEnvironment env)
        {
            _adminRepository = adminRepository;
            _env = env;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            var stats = await _adminRepository.GetDashboardStats();
            return Ok(stats);
        }

        [HttpPost("upload")]
        [RequestSizeLimit(52428800)]
        [RequestFormLimits(MultipartBodyLengthLimit = 52428800)]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Dosya seçilmedi");

            if (file.Length > 10 * 1024 * 1024)
                return BadRequest("Dosya boyutu 10MB'dan büyük olamaz");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP)");

            var allowedContentTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest("Geçersiz dosya türü");

            try
            {
                var webRoot = _env.WebRootPath;
                if (string.IsNullOrEmpty(webRoot))
                {
                    webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }

                var uploadsFolder = Path.Combine(webRoot, "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = Guid.NewGuid().ToString() + extension;
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true))
                {
                    await file.CopyToAsync(stream);
                }

                var fileUrl = $"/uploads/{fileName}";
                return Ok(new { url = fileUrl });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Upload Error: {ex}");
                return StatusCode(500, $"Sunucu hatası: {ex.Message}");
            }
        }
    }
}
