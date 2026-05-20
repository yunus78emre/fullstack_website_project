using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs.Advisor;
using backend.Services;

namespace backend.Controllers
{
    /// <summary>
    /// Advisor-area controller. All endpoints require the "Advisor" role.
    /// Future sub-features (Search, Availability) will be added here.
    /// </summary>
    [ApiController]
    [Route("api/advisor")]
    [Tags("Advisor")]
    [Authorize(Roles = "Advisor")]
    public class AdvisorController : ControllerBase
    {
        private readonly IAdvisorProfileService _profileService;

        public AdvisorController(IAdvisorProfileService profileService)
        {
            _profileService = profileService;
        }

        // ==========================================================
        // PROFILE ENDPOINTS
        // ==========================================================

        /// <summary>
        /// Returns the authenticated advisor's own profile information.
        /// Combines data from `users` and `advisor_profiles` tables.
        /// </summary>
        [HttpGet("profile/me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var profile = await _profileService.GetProfileByUserIdAsync(userId);

            if (profile == null)
            {
                return NotFound(new { message = "Advisor profile not found for the current user." });
            }

            return Ok(profile);
        }

        /// <summary>
        /// Retrieves the advisor's current capacity and availability across all relevant categories.
        /// Shows usage like "2/3" for categories with defined limits.
        /// </summary>
        [HttpGet("profile/availability")]
        public async Task<IActionResult> GetAvailability()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var availability = await _profileService.GetMyAvailabilityAsync(userId);

            if (availability == null)
            {
                return NotFound(new { message = "Advisor profile not found for the current user." });
            }

            return Ok(availability);
        }

        /// <summary>
        /// Updates which categories this advisor accepts for project requests.
        /// </summary>
        [HttpPost("profile/availability")]
        public async Task<IActionResult> UpdateAvailability([FromBody] UpdateAdvisorAvailabilityRequestDTO dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var selectedCategoryIds = dto?.SelectedCategoryIds ?? new List<int>();
            var (success, message) = await _profileService.UpdateMyAvailabilityAsync(userId, selectedCategoryIds);
            if (!success)
            {
                return BadRequest(new { message });
            }

            var availability = await _profileService.GetMyAvailabilityAsync(userId);
            return Ok(new
            {
                message,
                items = availability ?? new List<AdvisorCategoryAvailabilityDTO>()
            });
        }

        // ==========================================================
        // PROJECT ENDPOINTS
        // ==========================================================

        /// <summary>
        /// Returns all projects where the authenticated advisor is assigned
        /// (via projects.advisor_assigned_id). Includes full project details,
        /// category, owner student, members, and skills.
        /// </summary>
        [HttpGet("projects/my-projects")]
        public async Task<IActionResult> GetMyProjects()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var projects = await _profileService.GetProjectsByUserIdAsync(userId);

            if (projects == null)
            {
                return NotFound(new { message = "Advisor profile not found for the current user." });
            }

            return Ok(projects);
        }

        // ==========================================================
        // REQUEST ENDPOINTS
        // ==========================================================

        /// <summary>
        /// Sends an advisor request for a student-owned project.
        /// Creates a PENDING row in advisor_requests. Does NOT auto-assign the advisor.
        /// </summary>
        [HttpPost("requests/send")]
        public async Task<IActionResult> SendAdvisorRequest([FromBody] AdvisorSendRequestRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var (response, statusCode, errorMessage) = await _profileService.SendAdvisorRequestAsync(userId, request);

            if (response == null)
            {
                return StatusCode(statusCode, new { message = errorMessage });
            }

            return StatusCode(statusCode, response);
        }

        /// <summary>
        /// Retrieves the list of incoming requests received by the authenticated advisor.
        /// Derives the sender student information from the project ownership relation.
        /// </summary>
        [HttpGet("requests/incoming")]
        public async Task<IActionResult> GetIncomingRequests()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var response = await _profileService.GetIncomingRequestsByUserIdAsync(userId);

            if (response == null)
            {
                return NotFound(new { message = "Advisor profile not found for the current user." });
            }

            return Ok(response);
        }

        public class AdvisorRespondRequestDTO
        {
            public bool Approved { get; set; }
        }

        /// <summary>
        /// Responds to an incoming advisor request.
        /// </summary>
        [HttpPost("requests/{requestId}/respond")]
        public async Task<IActionResult> RespondToRequest(
            int requestId,
            [FromBody] AdvisorRespondRequestDTO payload,
            [FromServices] AppDbContext dbContext,
            [FromServices] IAdvisorAvailabilityService availabilityService)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var advisorProfile = await dbContext.AdvisorProfiles.AsNoTracking().FirstOrDefaultAsync(ap => ap.UserId == userId);
            if (advisorProfile == null) return NotFound(new { message = "Advisor profile not found." });

            var advisorRequest = await dbContext.AdvisorRequests
                .Include(ar => ar.Project).ThenInclude(p => p!.OwnerStudent).ThenInclude(os => os!.User)
                .Include(ar => ar.Project).ThenInclude(p => p!.Category)
                .FirstOrDefaultAsync(ar => ar.Id == requestId);

            if (advisorRequest == null)
                return NotFound(new { message = "Request not found." });

            if (advisorRequest.AdvisorId != advisorProfile.Id)
                return StatusCode(403, new { message = "You do not have permission to respond to this request." });

            if (advisorRequest.Status != RequestStatus.PENDING)
                return BadRequest(new { message = "Request is already processed." });

            if (payload.Approved)
            {
                var project = advisorRequest.Project!;
                if (project.AdvisorAssignedId.HasValue && project.AdvisorAssignedId.Value != advisorProfile.Id)
                    return BadRequest(new { message = "This project already has an assigned advisor." });

                if (project.CategoryId.HasValue)
                {
                    var (isAvailable, message) = await availabilityService.CheckAvailabilityAsync(advisorProfile.Id, project.CategoryId.Value);
                    if (!isAvailable)
                        return BadRequest(new { message });
                }

                advisorRequest.Status = RequestStatus.ACCEPTED;
                project.AdvisorAssignedId = advisorProfile.Id;

                // Auto-reject other pending advisor requests for this project
                var otherPendingRequests = await dbContext.AdvisorRequests
                    .Where(ar => ar.ProjectId == project.Id && ar.Id != advisorRequest.Id && ar.Status == RequestStatus.PENDING)
                    .ToListAsync();

                foreach (var pendingReq in otherPendingRequests)
                {
                    pendingReq.Status = RequestStatus.REJECTED;
                }
            }
            else
            {
                advisorRequest.Status = RequestStatus.REJECTED;
            }

            // Create notification for the project owner
            string actionStr = payload.Approved ? "accepted" : "rejected";
            
            dbContext.Notifications.Add(new Notification
            {
                UserId = advisorRequest.Project!.OwnerStudent!.UserId,
                Title = $"Advisor Request {actionStr}",
                Body = $"Advisor has {actionStr} your request for project '{advisorRequest.Project.Title}'.",
                Kind = "project",
                ProjectCategory = advisorRequest.Project.Category?.Name,
                CreatedAt = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync();
            return Ok(new { message = $"Request has been {actionStr}." });
        }

        // ==========================================================
        // SEARCH ENDPOINTS (Project discovery)
        // ==========================================================

        /// <summary>
        /// Searches for student-owned projects suitable for advisor joining.
        /// Supports dynamic filters, sorting, and pagination via query parameters.
        /// </summary>
        [HttpGet("search/projects")]
        public async Task<IActionResult> SearchProjects([FromQuery] AdvisorSearchProjectsQueryDTO query)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var response = await _profileService.SearchProjectsAsync(userId, query);

            if (response == null)
            {
                return NotFound(new { message = "Advisor profile not found for the current user." });
            }

            return Ok(response);
        }

        /// <summary>
        /// Retrieves a combined announcement feed for the advisor.
        /// Aggregates system announcements, new categories, and student projects looking for mentors.
        /// </summary>
        [HttpGet("announcements/feed")]
        public async Task<IActionResult> GetAnnouncementsFeed()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var response = await _profileService.GetAnnouncementsFeedAsync(userId);

            if (response == null)
            {
                return NotFound(new { message = "Advisor profile not found for the current user." });
            }

            return Ok(response);
        }
    }
}

