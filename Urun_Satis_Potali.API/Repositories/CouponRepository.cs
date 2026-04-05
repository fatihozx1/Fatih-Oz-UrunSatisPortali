using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using Urun_Satis_Potali.API.Data;
using Urun_Satis_Potali.API.Models;

namespace Urun_Satis_Potali.API.Repositories
{
    public class CouponRepository
    {
        private readonly AppDbContext _context;

        public CouponRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Coupon>> GetAllCoupons()
        {
            return await _context.Set<Coupon>().ToListAsync();
        }

        public async Task<Coupon?> GetCouponByCode(string code)
        {
            return await _context.Set<Coupon>()
                .FirstOrDefaultAsync(c => c.Code.ToLower() == code.ToLower() && c.IsActive);
        }

        public async Task<Coupon?> GetCouponById(int id)
        {
            return await _context.Set<Coupon>().FindAsync(id);
        }

        public async Task<Coupon> AddCoupon(Coupon coupon)
        {
            await _context.Set<Coupon>().AddAsync(coupon);
            await _context.SaveChangesAsync();
            return coupon;
        }

        public async Task<Coupon> UpdateCoupon(Coupon coupon)
        {
            _context.Set<Coupon>().Update(coupon);
            await _context.SaveChangesAsync();
            return coupon;
        }

        public async Task<bool> DeleteCoupon(int id)
        {
            var coupon = await _context.Set<Coupon>().FindAsync(id);
            if (coupon == null) return false;

            _context.Set<Coupon>().Remove(coupon);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
