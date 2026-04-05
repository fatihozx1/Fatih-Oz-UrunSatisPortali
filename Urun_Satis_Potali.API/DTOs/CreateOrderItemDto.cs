using System.ComponentModel.DataAnnotations;

namespace Urun_Satis_Potali.API.DTOs
{
    public class CreateOrderItemDto
    {
        [Required]
        public int ProductId { get; set; }
        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }
}
