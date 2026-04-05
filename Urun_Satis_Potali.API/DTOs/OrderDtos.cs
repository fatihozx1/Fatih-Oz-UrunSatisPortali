using System;
using System.Collections.Generic;

namespace Urun_Satis_Potali.API.DTOs
{
    public class OrderDto
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? CouponCode { get; set; }
        public string? Note { get; set; }
        public string UserName { get; set; } = string.Empty;
        public List<OrderItemDto> OrderItems { get; set; } = new List<OrderItemDto>();
    }
}
