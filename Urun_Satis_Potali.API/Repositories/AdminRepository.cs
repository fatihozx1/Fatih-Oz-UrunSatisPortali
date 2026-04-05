using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Urun_Satis_Potali.API.Data;
using Urun_Satis_Potali.API.DTOs;
using Urun_Satis_Potali.API.Models;

namespace Urun_Satis_Potali.API.Repositories
{
    public class AdminRepository
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;

        public AdminRepository(AppDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<DashboardStatsDto> GetDashboardStats()
        {
            var stats = new DashboardStatsDto();

            // Total Revenue
            stats.TotalRevenue = await _context.Orders.SumAsync(o => o.TotalPrice);

            // Total Orders count
            stats.TotalOrders = await _context.Orders.CountAsync();

            // Total Users count
            stats.TotalUsers = await _userManager.Users.CountAsync();

            // Total Products count
            stats.TotalProducts = await _context.Products.CountAsync();

            // Active Coupons count
            stats.ActiveCouponsCount = await _context.Coupons
                .CountAsync(c => c.IsActive && c.ExpiryDate > DateTime.Now);

            // Recent Orders (Last 5)
            var recentOrders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .Take(5)
                .ToListAsync();

            stats.RecentOrders = recentOrders.Select(o => new OrderDto
            {
                Id = o.Id,
                OrderDate = o.OrderDate,
                TotalPrice = o.TotalPrice,
                DiscountAmount = o.DiscountAmount,
                CouponCode = o.CouponCode,
                Note = o.Note,
                UserName = o.User?.UserName ?? "Unknown",
                OrderItems = o.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? "N/A",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList()
            }).ToList();

            return stats;
        }
    }
}
