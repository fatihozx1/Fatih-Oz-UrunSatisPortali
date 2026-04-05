using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Urun_Satis_Potali.API.DTOs;
using Urun_Satis_Potali.API.Models;
using Urun_Satis_Potali.API.Repositories;

namespace Urun_Satis_Potali.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly OrderRepository _orderRepository;
        private readonly ProductRepository _productRepository;
        private readonly CouponRepository _couponRepository;
        private readonly UserManager<User> _userManager;

        public OrdersController(OrderRepository orderRepository, ProductRepository productRepository, CouponRepository couponRepository, UserManager<User> userManager)
        {
            _orderRepository = orderRepository;
            _productRepository = productRepository;
            _couponRepository = couponRepository;
            _userManager = userManager;
        }

        [HttpGet("my-orders")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetMyOrders()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var orders = await _orderRepository.GetOrdersByUser(userId);
            var dtos = orders.Select(o => MapToOrderDto(o));

            return Ok(dtos);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetAllOrders()
        {
            var orders = await _orderRepository.GetAllOrders();
            var dtos = orders.Select(o => MapToOrderDto(o));
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            var order = await _orderRepository.GetOrderById(id);
            if (order == null) return NotFound();

            // Security: Only Admin or the owner can see the order
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!User.IsInRole("Admin") && order.UserId != userId) return Forbid();

            return Ok(MapToOrderDto(order));
        }

        [HttpPost]
        public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto createOrderDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                Note = createOrderDto.Note,
                OrderItems = new List<OrderItem>()
            };

            decimal total = 0;
            foreach (var itemDto in createOrderDto.OrderItems)
            {
                var product = await _productRepository.GetProductById(itemDto.ProductId);
                if (product == null) return BadRequest($"Product with ID {itemDto.ProductId} not found");
                if (product.Stock < itemDto.Quantity) return BadRequest($"Insufficient stock for {product.Name}");

                var orderItem = new OrderItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = product.Price
                };

                order.OrderItems.Add(orderItem);
                total += orderItem.UnitPrice * orderItem.Quantity;

                // Update stock (ideally in a service layer with transaction)
                product.Stock -= itemDto.Quantity;
                await _productRepository.UpdateProduct(product);
            }

            order.TotalPrice = total;

            // Apply Coupon
            if (!string.IsNullOrEmpty(createOrderDto.CouponCode))
            {
                var coupon = await _couponRepository.GetCouponByCode(createOrderDto.CouponCode);
                if (coupon != null && coupon.IsActive && coupon.ExpiryDate > DateTime.Now)
                {
                    decimal discount = 0;
                    if (coupon.IsPercentage)
                    {
                        discount = (order.TotalPrice * coupon.DiscountAmount) / 100;
                    }
                    else
                    {
                        discount = coupon.DiscountAmount;
                    }

                    order.DiscountAmount = discount;
                    order.CouponCode = coupon.Code;
                    order.TotalPrice -= discount;
                    
                    if (order.TotalPrice < 0) order.TotalPrice = 0;
                }
            }

            var createdOrder = await _orderRepository.CreateOrder(order);

            return Ok(MapToOrderDto(createdOrder));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string status)
        {
            var success = await _orderRepository.UpdateOrderStatus(id, status);
            if (!success) return NotFound();
            return Ok(new { message = "Order status updated successfully", id = id, status = status });
        }

        private OrderDto MapToOrderDto(Order o)
        {
            return new OrderDto
            {
                Id = o.Id,
                OrderDate = o.OrderDate,
                TotalPrice = o.TotalPrice,
                DiscountAmount = o.DiscountAmount,
                CouponCode = o.CouponCode,
                Note = o.Note,
                UserName = o.User?.UserName ?? "Unknown",
                OrderItems = o.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? "Deleted Product",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList()
            };
        }
    }
}
