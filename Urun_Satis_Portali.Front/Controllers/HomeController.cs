using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using Urun_Satis_Portali.Front.Models;

namespace Urun_Satis_Portali.Front.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult ProductDetail(int id)
        {
            ViewBag.ProductId = id;
            return View();
        }

        public IActionResult Checkout()
        {
            return View();
        }

        public IActionResult MyOrders()
        {
            return View();
        }

        public IActionResult Login()
        {
            return View();
        }

        public IActionResult Register()
        {
            return View();
        }

        public IActionResult Admin()
        {
            return View();
        }

        public IActionResult AdminOrders()
        {
            return View();
        }

        public IActionResult Settings()
        {
            return View();
        }
        
        public IActionResult Products()
        {
            return View();
        }

        public IActionResult Categories()
        {
            return View();
        }

        public IActionResult Coupons()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
