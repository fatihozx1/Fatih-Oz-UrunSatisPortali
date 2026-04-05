using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Urun_Satis_Potali.API.DTOs;
using Urun_Satis_Potali.API.Models;
using Urun_Satis_Potali.API.Repositories;

namespace Urun_Satis_Potali.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly CouponRepository _couponRepository;

        public CouponsController(CouponRepository couponRepository)
        {
            _couponRepository = couponRepository;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CouponDto>>> GetCoupons()
        {
            var coupons = await _couponRepository.GetAllCoupons();
            var dtos = coupons.Select(c => MapToCouponDto(c));
            return Ok(dtos);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<ActionResult<CouponDto>> GetCoupon(int id)
        {
            var coupon = await _couponRepository.GetCouponById(id);
            if (coupon == null) return NotFound();
            return Ok(MapToCouponDto(coupon));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<CouponDto>> CreateCoupon(CreateCouponDto createCouponDto)
        {
            var existing = await _couponRepository.GetCouponByCode(createCouponDto.Code);
            if (existing != null) return BadRequest("Coupon code already exists");

            var coupon = new Coupon
            {
                Code = createCouponDto.Code,
                DiscountAmount = createCouponDto.DiscountAmount,
                IsPercentage = createCouponDto.IsPercentage,
                ExpiryDate = createCouponDto.ExpiryDate,
                IsActive = true
            };

            var created = await _couponRepository.AddCoupon(coupon);
            return Ok(MapToCouponDto(created));
        }
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCoupon(int id, CreateCouponDto updateCouponDto)
        {
            var coupon = await _couponRepository.GetCouponById(id);
            if (coupon == null) return NotFound();

            coupon.Code = updateCouponDto.Code;
            coupon.DiscountAmount = updateCouponDto.DiscountAmount;
            coupon.IsPercentage = updateCouponDto.IsPercentage;
            coupon.ExpiryDate = updateCouponDto.ExpiryDate;

            await _couponRepository.UpdateCoupon(coupon);
            return Ok(MapToCouponDto(coupon));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("toggle-active/{id}")]
        public async Task<IActionResult> ToggleCouponStatus(int id)
        {
            var coupon = await _couponRepository.GetCouponById(id);
            if (coupon == null) return NotFound();

            coupon.IsActive = !coupon.IsActive;
            await _couponRepository.UpdateCoupon(coupon);
            return Ok(new { IsActive = coupon.IsActive });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var success = await _couponRepository.DeleteCoupon(id);
            if (!success) return NotFound();
            return Ok(new { message = "Coupon deleted successfully", id = id });
        }

        [Authorize]
        [HttpGet("validate/{code}")]
        public async Task<ActionResult<CouponDto>> ValidateCoupon(string code)
        {
            var coupon = await _couponRepository.GetCouponByCode(code);
            if (coupon == null || !coupon.IsActive || coupon.ExpiryDate < System.DateTime.Now)
                return NotFound("Invalid or expired coupon");

            return Ok(MapToCouponDto(coupon));
        }

        private CouponDto MapToCouponDto(Coupon c)
        {
            return new CouponDto
            {
                Id = c.Id,
                Code = c.Code,
                DiscountAmount = c.DiscountAmount,
                IsPercentage = c.IsPercentage,
                ExpiryDate = c.ExpiryDate,
                IsActive = c.IsActive
            };
        }
    }
}
