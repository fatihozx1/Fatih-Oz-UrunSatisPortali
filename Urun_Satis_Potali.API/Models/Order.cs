using System;
using System.Collections.Generic;

namespace Urun_Satis_Potali.API.Models
{
    public class Order
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.Now;
        public decimal TotalPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? CouponCode { get; set; }
        public string? Note { get; set; }

        public string UserId { get; set; } = string.Empty;
        public User User { get; set; } = null!;

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
