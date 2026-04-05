using System.Collections.Generic;

namespace Urun_Satis_Potali.API.DTOs
{
    public class DashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int TotalUsers { get; set; }
        public int TotalProducts { get; set; }
        public int ActiveCouponsCount { get; set; }
        public List<OrderDto> RecentOrders { get; set; } = new List<OrderDto>();
    }
}
