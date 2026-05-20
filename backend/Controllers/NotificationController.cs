using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                throw new UnauthorizedAccessException("Geçersiz kullanıcı token'ı.");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            try
            {
                int userId = GetCurrentUserId();

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NotificationDto
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Body = n.Body,
                        Read = n.IsRead,
                        Kind = n.Kind,
                        ProjectCategory = n.ProjectCategory,
                        CreatedAt = n.CreatedAt
                    })
                    .ToListAsync();

                return Ok(notifications);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                int userId = GetCurrentUserId();

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

                if (notification == null)
                    return NotFound(new { message = "Bildirim bulunamadı." });

                notification.IsRead = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Bildirim okundu olarak işaretlendi." });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        /// <summary>
        /// Marks every unread notification belonging to the current user as read.
        /// Returns the number of notifications affected.
        /// </summary>
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                int userId = GetCurrentUserId();

                var unread = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                if (unread.Count == 0)
                    return Ok(new { message = "Okunmamış bildirim bulunamadı.", updated = 0 });

                foreach (var n in unread)
                    n.IsRead = true;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Tüm bildirimler okundu olarak işaretlendi.", updated = unread.Count });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }
    }
}
