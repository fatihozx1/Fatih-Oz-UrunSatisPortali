using System;
using System.ComponentModel.DataAnnotations;

namespace Urun_Satis_Potali.API.Models
{
    public class Coupon
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        public decimal DiscountAmount { get; set; }

        public bool IsPercentage { get; set; } // true if percentage, false if fixed amount

        public DateTime ExpiryDate { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
