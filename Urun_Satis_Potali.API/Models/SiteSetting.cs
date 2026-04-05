using System.ComponentModel.DataAnnotations;

namespace Urun_Satis_Potali.API.Models
{
    public class SiteSetting
    {
        [Key]
        public string Key { get; set; } = string.Empty;
        
        [Required]
        public string Value { get; set; } = string.Empty;

        public string? Description { get; set; }
    }
}
