using System.ComponentModel.DataAnnotations;

namespace Urun_Satis_Potali.API.DTOs
{
    public class CreateOrderDto
    {
        public string? CouponCode { get; set; }
        public string? Note { get; set; }
        [Required]
        [MinLength(1)]
        public List<CreateOrderItemDto> OrderItems { get; set; } = new List<CreateOrderItemDto>();
    }
}
