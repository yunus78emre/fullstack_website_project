using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;
using backend.Models;
using backend.DTOs.Admin;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Tags("Admin")]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================================
        // PROJECT CATEGORY MANAGEMENT
        // ==========================================================

        /// <summary>
        /// Retrieves all project categories.
        /// Accessible to every authenticated user (Student, Advisor, Admin) because
        /// category metadata is needed on dashboards (project creation, filters, labels, colors).
        /// </summary>
        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories()
        {
            try
            {
                // Fetch all categories from the database
                var categories = await _context.ProjectCategories
                    .AsNoTracking()
                    .Select(c => new CategoryResponseDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description ?? string.Empty,
                        DefaultTeamSize = c.DefaultTeamSize,
                        DefaultBudget = c.DefaultBudget,
                        AdvisorRequired = c.AdvisorRequired,
                        MaxProjectsPerAdvisor = c.MaxProjectsPerAdvisor,
                        EventDate = c.EventDate,
                        Color = c.Color
                    })
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving categories.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new project category.
        /// </summary>
        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Check for duplicate category name to maintain data integrity
                bool nameExists = await _context.ProjectCategories
                    .AnyAsync(c => c.Name.ToLower() == dto.Name.ToLower());

                if (nameExists)
                {
                    return Conflict(new { message = "A category with this name already exists." });
                }

                // Enforce color uniqueness — each category must have a distinct color.
                // Normalize to lowercase hex for case-insensitive comparison.
                var normalizedColor = dto.Color.ToLowerInvariant();
                bool colorExists = await _context.ProjectCategories
                    .AnyAsync(c => c.Color.ToLower() == normalizedColor);

                if (colorExists)
                {
                    return Conflict(new { message = "Another category is already using this color. Please pick a different one." });
                }

                // Map DTO to entity
                var category = new ProjectCategory
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    DefaultTeamSize = dto.DefaultTeamSize,
                    DefaultBudget = dto.DefaultBudget,
                    AdvisorRequired = dto.AdvisorRequired,
                    MaxProjectsPerAdvisor = dto.MaxProjectsPerAdvisor,
                    EventDate = dto.EventDate,
                    Color = normalizedColor
                };

                _context.ProjectCategories.Add(category);
                await _context.SaveChangesAsync();

                // Notify every Student and Advisor about the new category so it appears
                // immediately in their dashboards/notification feeds. Admins do not receive
                // the notification because they created it themselves.
                var targetUserIds = await _context.Users
                    .Where(u => u.Role != null && u.Role.RoleName != "Admin")
                    .Select(u => u.Id)
                    .ToListAsync();

                if (targetUserIds.Count > 0)
                {
                    var notifications = targetUserIds.Select(uid => new Notification
                    {
                        UserId = uid,
                        Title = "New Project Category",
                        Body = $"A new project category '{category.Name}' has been added.",
                        Kind = "category",
                        ProjectCategory = category.Name,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();

                    _context.Notifications.AddRange(notifications);
                    await _context.SaveChangesAsync();
                }

                // Build response DTO
                var responseDto = new CategoryResponseDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    DefaultTeamSize = category.DefaultTeamSize,
                    DefaultBudget = category.DefaultBudget,
                    AdvisorRequired = category.AdvisorRequired,
                    MaxProjectsPerAdvisor = category.MaxProjectsPerAdvisor,
                    EventDate = category.EventDate,
                    Color = category.Color
                };

                return StatusCode(201, responseDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the category.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Updates an existing project category by its ID.
        /// </summary>
        [HttpPut("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Find the category to update
                var category = await _context.ProjectCategories
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (category == null)
                {
                    return NotFound(new { message = $"Category with ID {id} was not found." });
                }

                // Check if another category already uses the new name (case-insensitive)
                bool duplicateName = await _context.ProjectCategories
                    .AnyAsync(c => c.Id != id && c.Name.ToLower() == dto.Name.ToLower());

                if (duplicateName)
                {
                    return Conflict(new { message = "Another category with this name already exists." });
                }

                // Check if another category already uses this color (case-insensitive)
                var normalizedColor = dto.Color.ToLowerInvariant();
                bool duplicateColor = await _context.ProjectCategories
                    .AnyAsync(c => c.Id != id && c.Color.ToLower() == normalizedColor);

                if (duplicateColor)
                {
                    return Conflict(new { message = "Another category is already using this color. Please pick a different one." });
                }

                // Apply updates from DTO to entity
                category.Name = dto.Name;
                category.Description = dto.Description;
                category.DefaultTeamSize = dto.DefaultTeamSize;
                category.DefaultBudget = dto.DefaultBudget;
                category.AdvisorRequired = dto.AdvisorRequired;
                category.MaxProjectsPerAdvisor = dto.MaxProjectsPerAdvisor;
                category.EventDate = dto.EventDate;
                category.Color = normalizedColor;

                await _context.SaveChangesAsync();

                // Build response DTO
                var responseDto = new CategoryResponseDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    DefaultTeamSize = category.DefaultTeamSize,
                    DefaultBudget = category.DefaultBudget,
                    AdvisorRequired = category.AdvisorRequired,
                    MaxProjectsPerAdvisor = category.MaxProjectsPerAdvisor,
                    EventDate = category.EventDate,
                    Color = category.Color
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the category.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a project category by its ID.
        /// Rejects deletion if any projects are currently linked to this category.
        /// </summary>
        [HttpDelete("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                // Find the category to delete
                var category = await _context.ProjectCategories
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (category == null)
                {
                    return NotFound(new { message = $"Category with ID {id} was not found." });
                }

                // Referential integrity check: block deletion if projects are linked
                bool hasLinkedProjects = await _context.Projects
                    .AnyAsync(p => p.CategoryId == id);

                if (hasLinkedProjects)
                {
                    return Conflict(new
                    {
                        message = "This category cannot be deleted because there are existing projects linked to it. " +
                                  "Please reassign or delete those projects first."
                    });
                }

                // Also check if any announcements reference this category
                bool hasLinkedAnnouncements = await _context.Announcements
                    .AnyAsync(a => a.CategoryId == id);

                if (hasLinkedAnnouncements)
                {
                    return Conflict(new
                    {
                        message = "This category cannot be deleted because there are announcements linked to it. " +
                                  "Please reassign or delete those announcements first."
                    });
                }

                _context.ProjectCategories.Remove(category);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Category '{category.Name}' (ID: {id}) has been successfully deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the category.", detail = ex.Message });
            }
        }

        // ==========================================================
        // ANNOUNCEMENT MANAGEMENT
        // ==========================================================

        /// <summary>
        /// Retrieves all announcements with publisher and category details.
        /// </summary>
        [HttpGet("announcements")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAnnouncements()
        {
            try
            {
                // Fetch announcements with their related publisher and category data
                var announcements = await _context.Announcements
                    .Include(a => a.Publisher)
                    .Include(a => a.Category)
                    .AsNoTracking()
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => new AnnouncementResponseDto
                    {
                        Id = a.Id,
                        Title = a.Title ?? string.Empty,
                        Description = a.Description,
                        CreatedAt = a.CreatedAt,
                        Publisher = a.Publisher != null ? new AnnouncementPublisherDto
                        {
                            UserId = a.Publisher.Id,
                            FullName = a.Publisher.FullName,
                            Email = a.Publisher.Email
                        } : null,
                        Category = a.Category != null ? new AnnouncementCategoryDto
                        {
                            Id = a.Category.Id,
                            Name = a.Category.Name,
                            Color = a.Category.Color
                        } : null
                    })
                    .ToListAsync();

                return Ok(announcements);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving announcements.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new announcement. The CreatedAt timestamp is set to UTC now automatically.
        /// The PublishedBy field is set to the currently authenticated admin user.
        /// </summary>
        [HttpPost("announcements")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAnnouncement([FromBody] AnnouncementCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Extract the admin's user ID from the JWT token
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int adminUserId))
                {
                    return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
                }

                // Validate category reference if provided
                if (dto.CategoryId.HasValue)
                {
                    bool categoryExists = await _context.ProjectCategories
                        .AnyAsync(c => c.Id == dto.CategoryId.Value);

                    if (!categoryExists)
                    {
                        return BadRequest(new { message = "The specified category does not exist." });
                    }
                }

                // Map DTO to entity with automatic UTC timestamp
                var announcement = new Announcement
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    CategoryId = dto.CategoryId,
                    PublishedBy = adminUserId,
                    CreatedAt = DateTime.UtcNow  // Automatic UTC timestamp assignment
                };

                _context.Announcements.Add(announcement);
                await _context.SaveChangesAsync();

                // Reload the announcement with navigation properties for the response
                var createdAnnouncement = await _context.Announcements
                    .Include(a => a.Publisher)
                    .Include(a => a.Category)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == announcement.Id);

                // Add Notification for ALL users
                var allUserIds = await _context.Users.Select(u => u.Id).ToListAsync();
                var notifications = allUserIds.Select(uid => new Notification
                {
                    UserId = uid,
                    Title = "New Announcement",
                    Body = $"A new announcement '{dto.Title}' has been published.",
                    Kind = "announcement",
                    ProjectCategory = createdAnnouncement?.Category?.Name,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync();

                // Build response DTO
                var responseDto = new AnnouncementResponseDto
                {
                    Id = announcement.Id,
                    Title = announcement.Title ?? string.Empty,
                    Description = announcement.Description,
                    CreatedAt = announcement.CreatedAt,
                    Publisher = createdAnnouncement?.Publisher != null ? new AnnouncementPublisherDto
                    {
                        UserId = createdAnnouncement.Publisher.Id,
                        FullName = createdAnnouncement.Publisher.FullName,
                        Email = createdAnnouncement.Publisher.Email
                    } : null,
                    Category = createdAnnouncement?.Category != null ? new AnnouncementCategoryDto
                    {
                        Id = createdAnnouncement.Category.Id,
                        Name = createdAnnouncement.Category.Name,
                        Color = createdAnnouncement.Category.Color
                    } : null
                };

                return StatusCode(201, responseDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the announcement.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Updates an existing announcement by its ID.
        /// </summary>
        [HttpPut("announcements/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAnnouncement(int id, [FromBody] AnnouncementUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Find the announcement to update
                var announcement = await _context.Announcements
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (announcement == null)
                {
                    return NotFound(new { message = $"Announcement with ID {id} was not found." });
                }

                // Validate category reference if provided
                if (dto.CategoryId.HasValue)
                {
                    bool categoryExists = await _context.ProjectCategories
                        .AnyAsync(c => c.Id == dto.CategoryId.Value);

                    if (!categoryExists)
                    {
                        return BadRequest(new { message = "The specified category does not exist." });
                    }
                }

                // Apply updates from DTO to entity (CreatedAt remains unchanged)
                announcement.Title = dto.Title;
                announcement.Description = dto.Description;
                announcement.CategoryId = dto.CategoryId;

                await _context.SaveChangesAsync();

                // Reload with navigation properties for the response
                var updatedAnnouncement = await _context.Announcements
                    .Include(a => a.Publisher)
                    .Include(a => a.Category)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == id);

                // Build response DTO
                var responseDto = new AnnouncementResponseDto
                {
                    Id = announcement.Id,
                    Title = announcement.Title ?? string.Empty,
                    Description = announcement.Description,
                    CreatedAt = announcement.CreatedAt,
                    Publisher = updatedAnnouncement?.Publisher != null ? new AnnouncementPublisherDto
                    {
                        UserId = updatedAnnouncement.Publisher.Id,
                        FullName = updatedAnnouncement.Publisher.FullName,
                        Email = updatedAnnouncement.Publisher.Email
                    } : null,
                    Category = updatedAnnouncement?.Category != null ? new AnnouncementCategoryDto
                    {
                        Id = updatedAnnouncement.Category.Id,
                        Name = updatedAnnouncement.Category.Name,
                        Color = updatedAnnouncement.Category.Color
                    } : null
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the announcement.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Deletes an announcement by its ID.
        /// </summary>
        [HttpDelete("announcements/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            try
            {
                // Find the announcement to delete
                var announcement = await _context.Announcements
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (announcement == null)
                {
                    return NotFound(new { message = $"Announcement with ID {id} was not found." });
                }

                _context.Announcements.Remove(announcement);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Announcement '{announcement.Title}' (ID: {id}) has been successfully deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the announcement.", detail = ex.Message });
            }
        }
    }
}
