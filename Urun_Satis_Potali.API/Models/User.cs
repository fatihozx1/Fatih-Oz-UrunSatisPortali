using Microsoft.AspNetCore.Identity;

namespace Urun_Satis_Potali.API.Models
{
    public class User : IdentityUser
    {
        public string? FullName { get; set; }
    }
}
