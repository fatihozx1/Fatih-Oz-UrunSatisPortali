using System.ComponentModel.DataAnnotations;

namespace Urun_Satis_Potali.API.DTOs
{
    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
