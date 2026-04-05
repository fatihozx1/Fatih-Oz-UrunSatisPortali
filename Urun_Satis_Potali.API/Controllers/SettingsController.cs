using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using Urun_Satis_Potali.API.Data;
using Urun_Satis_Potali.API.Models;

namespace Urun_Satis_Potali.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SiteSetting>>> GetSettings()
        {
            return await _context.SiteSettings.ToListAsync();
        }

        [HttpGet("{key}")]
        public async Task<ActionResult<SiteSetting>> GetSetting(string key)
        {
            var setting = await _context.SiteSettings.FindAsync(key);
            if (setting == null) return NotFound();
            return setting;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> UpdateSetting(SiteSetting setting)
        {
            var existing = await _context.SiteSettings.FindAsync(setting.Key);
            if (existing == null)
            {
                _context.SiteSettings.Add(setting);
            }
            else
            {
                existing.Value = setting.Value;
                if (!string.IsNullOrEmpty(setting.Description))
                    existing.Description = setting.Description;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Setting updated successfully", key = setting.Key });
        }
    }
}
