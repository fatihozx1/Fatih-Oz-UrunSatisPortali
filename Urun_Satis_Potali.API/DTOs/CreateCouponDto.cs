using System.ComponentModel.DataAnnotations;

namespace Urun_Satis_Potali.API.DTOs
{
    public class CreateCouponDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal DiscountAmount { get; set; }

        public bool IsPercentage { get; set; }

        [Required]
        public DateTime ExpiryDate { get; set; }
    }
}
