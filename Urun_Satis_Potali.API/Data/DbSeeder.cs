using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading.Tasks;
using Urun_Satis_Potali.API.Data;
using Urun_Satis_Potali.API.Models;

namespace Urun_Satis_Potali.API.Data
{
    public static class DbSeeder
    {
        public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

            // Seed Roles
            string[] roles = { "Admin", "Customer" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // Seed Admin User
            var adminEmail = "admin@example.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                var newAdmin = new User
                {
                    UserName = "admin",
                    Email = adminEmail,
                    FullName = "System Administrator",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(newAdmin, "Admin123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(newAdmin, "Admin");
                }
            }

            // Seed Categories and Products
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            if (!context.Categories.Any())
            {
                var categories = new[]
                {
                    new Category { Name = "Electronics" },
                    new Category { Name = "Fashion" },
                    new Category { Name = "Home & Garden" }
                };
                context.Categories.AddRange(categories);
                await context.SaveChangesAsync();

                if (!context.Products.Any())
                {
                    var electronics = categories.First(c => c.Name == "Electronics");
                    var fashion = categories.First(c => c.Name == "Fashion");

                    context.Products.AddRange(new[]
                    {
                        new Product { 
                            Name = "Quantum Watch", 
                            Description = "Next-gen smart watch with holographic display.", 
                            Price = 299.99m, 
                            Stock = 50, 
                            CategoryId = electronics.Id,
                            ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" 
                        },
                        new Product { 
                            Name = "Urban Jacket", 
                            Description = "Stylish all-weather jacket for the modern explorer.", 
                            Price = 129.50m, 
                            Stock = 100, 
                            CategoryId = fashion.Id,
                            ImageUrl = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80" 
                        }
                    });
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
