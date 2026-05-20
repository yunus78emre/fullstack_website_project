using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using backend.Data;
using backend.Models;
using backend.DTOs.Student;
using backend.DTOs.Advisor;
using backend.Services;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/student")]
    [Tags("Student")]
    [Authorize(Roles = "Student")]
    public class StudentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAdvisorAvailabilityService _availabilityService;

        public StudentController(AppDbContext context, IAdvisorAvailabilityService availabilityService)
        {
            _context = context;
            _availabilityService = availabilityService;
        }

        /// <summary>
        /// Retrieves the profile information for the currently authenticated student.
        /// </summary>
        [HttpGet("profile/me")]
        public async Task<IActionResult> GetMyProfile()
        {
            // Extract current user ID from the JWT token (NameIdentifier claim)
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            // Find the student profile and join with the User and Role tables
            var profile = await _context.StudentProfiles
                .Include(sp => sp.User)
                    .ThenInclude(u => u!.Role) // Ensure we have the exact Role entity for the name
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            // If no profile exists for this ID, return 404
            if (profile == null || profile.User == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            var skills = await _context.UserSkills
                .AsNoTracking()
                .Where(us => us.UserId == profile.UserId)
                .OrderBy(us => us.Skill!.SkillName)
                .Select(us => us.Skill!.SkillName)
                .ToListAsync();

            // Map database entities to the specific Response DTO
            var responseDto = new StudentProfileResponseDTO
            {
                // User-level information
                Id = profile.User.Id,
                FullName = profile.User.FullName,
                Email = profile.User.Email,
                CreatedAt = profile.User.CreatedAt,
                RoleName = profile.User.Role?.RoleName ?? "Student",

                // Profile-level information
                ProfileId = profile.Id,
                UserId = profile.UserId,
                Department = profile.Department,
                Year = profile.Year,
                Interests = profile.Interests,
                Bio = profile.Bio,
                GithubLink = profile.GithubLink,
                LinkedinLink = profile.LinkedinLink,
                Skills = skills
            };

            return Ok(responseDto);
        }

        /// <summary>
        /// Retrieves the projects the currently authenticated student is involved in,
        /// either as an owner or a member.
        /// </summary>
        [HttpGet("projects/my-projects")]
        public async Task<IActionResult> GetMyProjects()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var studentProfile = await _context.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            int profileId = studentProfile.Id;

            var projectsQuery = _context.Projects
                .AsNoTracking()
                .Where(p => p.OwnerStudentId == profileId || 
                            _context.ProjectMembers.Any(pm => pm.ProjectId == p.Id && pm.StudentId == profileId))
                .Select(p => new StudentProjectListItemDTO
                {
                    ProjectId = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    TeamSize = p.TeamSize,
                    Status = p.Status.ToString(),
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    Category = p.Category != null ? new StudentProjectCategoryDTO
                    {
                        Id = p.Category.Id,
                        Name = p.Category.Name,
                        Description = p.Category.Description,
                        DefaultTeamSize = p.Category.DefaultTeamSize,
                        DefaultBudget = p.Category.DefaultBudget,
                        AdvisorRequired = p.Category.AdvisorRequired,
                        EventDate = p.Category.EventDate,
                        Color = p.Category.Color
                    } : null,
                    Owner = new StudentProjectOwnerDTO
                    {
                        ProfileId = p.OwnerStudent!.Id,
                        UserId = p.OwnerStudent.UserId,
                        FullName = p.OwnerStudent.User!.FullName,
                        Email = p.OwnerStudent.User!.Email,
                        Department = p.OwnerStudent.Department,
                        Year = p.OwnerStudent.Year
                    },
                    Advisor = p.AdvisorAssigned != null ? new StudentProjectAdvisorDTO
                    {
                        ProfileId = p.AdvisorAssigned.Id,
                        UserId = p.AdvisorAssigned.UserId,
                        FullName = p.AdvisorAssigned.User!.FullName,
                        Email = p.AdvisorAssigned.User!.Email,
                        Department = p.AdvisorAssigned.Department,
                        AcademicTitle = p.AdvisorAssigned.AcademicTitle,
                        Expertise = p.AdvisorAssigned.Expertise,
                        ResearchInterests = p.AdvisorAssigned.ResearchInterests,
                        AvailableForAdvising = p.AdvisorAssigned.AvailableForAdvising
                    } : null,
                    Members = _context.ProjectMembers
                        .Where(pm => pm.ProjectId == p.Id)
                        .Select(pm => new StudentProjectMemberDTO
                        {
                            ProjectMemberId = pm.Id,
                            StudentProfileId = pm.StudentId,
                            UserId = pm.Student!.UserId,
                            FullName = pm.Student.User!.FullName,
                            Email = pm.Student.User!.Email,
                            Department = pm.Student.Department,
                            Year = pm.Student.Year,
                            MemberRole = pm.MemberRole
                        }).ToList(),
                    Skills = _context.ProjectSkills
                        .Where(ps => ps.ProjectId == p.Id)
                        .Select(ps => new StudentProjectSkillDTO
                        {
                            SkillId = ps.SkillId ?? 0,
                            SkillName = ps.Skill!.SkillName
                        }).ToList()
                });

            var projectList = await projectsQuery.ToListAsync();

            foreach (var project in projectList)
            {
                var distinctMemberIds = project.Members.Select(m => m.StudentProfileId).ToHashSet();
                distinctMemberIds.Add(project.Owner.ProfileId);
                project.TotalMemberCount = distinctMemberIds.Count;
            }

            return Ok(projectList);
        }

        /// <summary>
        /// Creates a new project under an existing category and automatically assigns the logged-in student as the owner.
        /// </summary>
        [HttpPost("projects/create")]
        public async Task<IActionResult> CreateProject([FromBody] StudentCreateProjectRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Read the current user's ID from the JWT token
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            // Ensure the student profile exists
            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null || studentProfile.User == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            // Ensure the referenced category exists
            var category = await _context.ProjectCategories
                .FirstOrDefaultAsync(c => c.Id == request.CategoryId);

            if (category == null)
            {
                // Following requirements: If the given category does not exist, return 400 Bad Request
                return BadRequest(new { message = "The selected project category does not exist." });
            }

            // Determine the final team size, prioritizing the client's input or falling back to the category default
            int finalTeamSize = request.TeamSize ?? category.DefaultTeamSize ?? 1;

            // Initialize the project entity
            var newProject = new Project
            {
                Title = request.Title,
                Description = request.Description,
                TeamSize = finalTeamSize,
                Status = ProjectStatus.OPEN, // Default to OPEN immediately
                CategoryId = category.Id,
                OwnerStudentId = studentProfile.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
                // advisor_assigned_id is left null explicitly until an advisor accepts a request
            };

            _context.Projects.Add(newProject);

            // Adding the owner to ProjectMembers automatically
            // REASONING: It standardizes the data model. If the frontend natively pulls "Team Members",
            // the owner naturally appears in the visual roster without requiring disjointed logic handling 
            // the owner separately from joined members.
            var projectMember = new ProjectMember
            {
                Project = newProject, // EF Core automatically links the newly generated Project ID
                StudentId = studentProfile.Id,
                MemberRole = "Project Owner" 
            };

            _context.ProjectMembers.Add(projectMember);

            // Save the entity and its relationships in a single transaction
            await _context.SaveChangesAsync();

            // Create notifications for all other students
            var otherStudentUserIds = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Student" && u.Id != userId)
                .Select(u => u.Id)
                .ToListAsync();

            if (otherStudentUserIds.Any())
            {
                var notifications = otherStudentUserIds.Select(id => new Notification
                {
                    UserId = id,
                    Title = "New Project Created",
                    Body = $"A new project named '{newProject.Title}' has been created.",
                    Kind = "project",
                    ProjectCategory = category.Name,
                    CreatedAt = DateTime.UtcNow
                });
                
                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync();
            }

            // Structure the secure response DTO
            var responseDto = new StudentCreateProjectResponseDTO
            {
                ProjectId = newProject.Id,
                Title = newProject.Title,
                Description = newProject.Description,
                TeamSize = newProject.TeamSize,
                Status = newProject.Status.ToString(),
                CreatedAt = newProject.CreatedAt,
                UpdatedAt = newProject.UpdatedAt,
                Category = new StudentCreateProjectCategoryDTO
                {
                    Id = category.Id,
                    Name = category.Name,
                    Color = category.Color
                },
                Owner = new StudentCreateProjectOwnerDTO
                {
                    ProfileId = studentProfile.Id,
                    FullName = studentProfile.User.FullName,
                    Email = studentProfile.User.Email
                }
            };

            return StatusCode(201, responseDto);
        }

        public class StudentUpdateProjectRequestDTO
        {
            public string? Title { get; set; }
            public string? Description { get; set; }
            public int? TeamSize { get; set; }
            public int? CategoryId { get; set; }
        }

        /// <summary>
        /// Updates an existing project owned by the logged-in student.
        /// </summary>
        [HttpPut("projects/{projectId}")]
        public async Task<IActionResult> UpdateProject(int projectId, [FromBody] StudentUpdateProjectRequestDTO request)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var studentProfile = await _context.StudentProfiles.FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (studentProfile == null) return NotFound(new { message = "Student profile not found." });

            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (project.OwnerStudentId != studentProfile.Id)
                return StatusCode(403, new { message = "You can only edit projects that you own." });

            bool changed = false;

            if (!string.IsNullOrWhiteSpace(request.Title) && project.Title != request.Title) { project.Title = request.Title; changed = true; }
            if (!string.IsNullOrWhiteSpace(request.Description) && project.Description != request.Description) { project.Description = request.Description; changed = true; }
            if (request.TeamSize.HasValue && project.TeamSize != request.TeamSize.Value) { project.TeamSize = request.TeamSize.Value; changed = true; }
            if (request.CategoryId.HasValue && project.CategoryId != request.CategoryId.Value) { project.CategoryId = request.CategoryId.Value; changed = true; }

            if (changed)
            {
                project.UpdatedAt = DateTime.UtcNow;

                // Notify other team members
                var memberUserIds = await _context.ProjectMembers
                    .Include(pm => pm.Student)
                    .Where(pm => pm.ProjectId == projectId && pm.StudentId != studentProfile.Id)
                    .Select(pm => pm.Student!.UserId)
                    .ToListAsync();

                if (memberUserIds.Any())
                {
                    var notifications = memberUserIds.Select(id => new Notification
                    {
                        UserId = id,
                        Title = "Project Updated",
                        Body = $"The project '{project.Title}' has been updated.",
                        Kind = "project",
                        CreatedAt = DateTime.UtcNow
                    });
                    
                    _context.Notifications.AddRange(notifications);
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Project updated successfully." });
        }

        /// <summary>
        /// Deletes an existing project owned by the logged-in student.
        /// </summary>
        [HttpDelete("projects/{projectId}")]
        public async Task<IActionResult> DeleteProject(int projectId)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var studentProfile = await _context.StudentProfiles.FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (studentProfile == null) return NotFound(new { message = "Student profile not found." });

            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (project.OwnerStudentId != studentProfile.Id)
                return StatusCode(403, new { message = "You can only delete projects that you own." });

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Project deleted successfully." });
        }

        /// <summary>
        /// Sends an advisor request for a project owned by the logged-in student.
        /// </summary>
        [HttpPost("advisor-requests/send")]
        public async Task<IActionResult> SendAdvisorRequest([FromBody] StudentSendAdvisorRequestRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Extract User ID from JWT Token
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            // Verify the Student Profile (eager-load User so we can safely read FullName later)
            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            // Verify Project & Ownership
            var project = await _context.Projects
                .Include(p => p.Category)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
            {
                return NotFound(new { message = "The specified project does not exist." });
            }

            if (project.OwnerStudentId != studentProfile.Id)
            {
                // Must explicitly prevent students from asking for advisors on behalf of someone else's project
                return StatusCode(403, new { message = "You can only send advisor requests for projects that you own." });
            }

            if (project.AdvisorAssignedId.HasValue)
            {
                return BadRequest(new { message = "This project already has an assigned advisor." });
            }

            // Verify Advisor exists
            var advisor = await _context.AdvisorProfiles
                .Include(ap => ap.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.Id == request.AdvisorId);

            if (advisor == null || advisor.User == null)
            {
                return BadRequest(new { message = "The selected advisor does not exist." });
            }

            // ─── CATEGORY CAPACITY ENFORCEMENT ────────────────────────────────────
            if (project.CategoryId.HasValue)
            {
                bool advisorAcceptsCategory = await _context.AdvisorCategoryPreferences
                    .AsNoTracking()
                    .AnyAsync(x => x.AdvisorId == advisor.Id && x.CategoryId == project.CategoryId.Value);
                if (!advisorAcceptsCategory)
                {
                    return BadRequest(new { message = "This advisor is not available for the project's category." });
                }

                var (isAvailable, message) = await _availabilityService.CheckAvailabilityAsync(advisor.Id, project.CategoryId.Value);
                if (!isAvailable)
                {
                    return BadRequest(new { message });
                }
            }

            // Prevent duplicate requests natively to respect the DB Unique constraints
            bool requestExists = await _context.AdvisorRequests
                .AnyAsync(ar => ar.ProjectId == request.ProjectId && ar.AdvisorId == request.AdvisorId);

            if (requestExists)
            {
                return Conflict(new { message = "An advisor request has already been sent to this advisor for this project." });
            }

            // Generate Request (Note: Assigns PENDING status automatically, but strictly leaves project.AdvisorAssignedId null)
            var advisorRequest = new AdvisorRequest
            {
                ProjectId = request.ProjectId,
                AdvisorId = request.AdvisorId,
                Message = request.Message,
                Status = RequestStatus.PENDING,
                CreatedAt = DateTime.UtcNow
            };

            _context.AdvisorRequests.Add(advisorRequest);
            
            // Add Notification for Advisor
            var notification = new Notification
            {
                UserId = advisor.UserId,
                Title = "New Advisor Request",
                Body = $"{studentProfile.User?.FullName ?? "A student"} requested you to advise their project: '{project.Title}'.",
                Kind = "project",
                ProjectCategory = project.Category?.Name,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Structure DTO Response
            var responseDto = new StudentSendAdvisorRequestResponseDTO
            {
                AdvisorRequestId = advisorRequest.Id,
                Message = advisorRequest.Message ?? string.Empty,
                Status = advisorRequest.Status.ToString(),
                CreatedAt = advisorRequest.CreatedAt,
                Project = new StudentSendAdvisorRequestProjectDTO
                {
                    Id = project.Id,
                    Title = project.Title
                },
                Advisor = new StudentSendAdvisorRequestAdvisorDTO
                {
                    Id = advisor.Id,
                    FullName = advisor.User.FullName,
                    Email = advisor.User.Email,
                    Department = advisor.Department
                }
            };

            return StatusCode(201, responseDto);
        }

        public class StudentSendJoinRequestDTO
        {
            public int ProjectId { get; set; }
            public string? Message { get; set; }
        }

        /// <summary>
        /// Sends a join request from the logged-in student to another student's project.
        /// </summary>
        [HttpPost("requests/send")]
        public async Task<IActionResult> SendJoinRequest([FromBody] StudentSendJoinRequestDTO request)
        {
            if (request.ProjectId <= 0)
            {
                return BadRequest(new { message = "Project ID is required." });
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            var project = await _context.Projects
                .Include(p => p.Category)
                .Include(p => p.OwnerStudent).ThenInclude(os => os!.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
            {
                return NotFound(new { message = "The specified project does not exist." });
            }

            if (project.OwnerStudentId == studentProfile.Id)
            {
                return BadRequest(new { message = "You cannot send a join request to your own project." });
            }

            bool isAlreadyMember = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == request.ProjectId && pm.StudentId == studentProfile.Id);
            if (isAlreadyMember)
            {
                return Conflict(new { message = "You are already a member of this project." });
            }

            bool requestExists = await _context.StudentRequests
                .AnyAsync(sr => sr.ProjectId == request.ProjectId && sr.ApplicantStudentId == studentProfile.Id);
            if (requestExists)
            {
                return Conflict(new { message = "You have already sent a join request for this project." });
            }

            var studentRequest = new StudentRequest
            {
                ProjectId = request.ProjectId,
                ApplicantStudentId = studentProfile.Id,
                Message = request.Message,
                Status = RequestStatus.PENDING,
                CreatedAt = DateTime.UtcNow
            };

            _context.StudentRequests.Add(studentRequest);

            var ownerUserId = project.OwnerStudent?.UserId;
            if (ownerUserId.HasValue)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = ownerUserId.Value,
                    Title = "Join Request",
                    Body = $"{studentProfile.User?.FullName ?? "A student"} requested to join your project: '{project.Title}'.",
                    Kind = "project",
                    ProjectCategory = project.Category?.Name,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                studentRequestId = studentRequest.Id,
                status = studentRequest.Status.ToString(),
                createdAt = studentRequest.CreatedAt
            });
        }

        public class StudentRespondRequestDTO
        {
            public bool Approved { get; set; }
        }

        [HttpPost("requests/{requestId}/respond")]
        public async Task<IActionResult> RespondToRequest(int requestId, [FromBody] StudentRespondRequestDTO payload)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var studentProfile = await _context.StudentProfiles
                .Include(sp => sp.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (studentProfile == null) return NotFound(new { message = "Student profile not found." });

            var studentRequest = await _context.StudentRequests
                .Include(sr => sr.Project).ThenInclude(p => p!.OwnerStudent).ThenInclude(os => os!.User)
                .Include(sr => sr.Project).ThenInclude(p => p!.Category)
                .Include(sr => sr.ApplicantStudent).ThenInclude(a => a!.User)
                .FirstOrDefaultAsync(sr => sr.Id == requestId);

            if (studentRequest == null)
                return NotFound(new { message = "Request not found." });

            // Ensure the user responding is the project owner
            if (studentRequest.Project!.OwnerStudentId != studentProfile.Id)
            {
                return StatusCode(403, new { message = "You do not have permission to respond to this request." });
            }

            if (studentRequest.Status != RequestStatus.PENDING)
            {
                return BadRequest(new { message = "Request is already processed." });
            }

            studentRequest.Status = payload.Approved ? RequestStatus.ACCEPTED : RequestStatus.REJECTED;

            if (payload.Approved)
            {
                _context.ProjectMembers.Add(new ProjectMember
                {
                    ProjectId = studentRequest.ProjectId,
                    StudentId = studentRequest.ApplicantStudentId,
                    MemberRole = "Member"
                });
            }

            // Notification for the sender
            int senderUserId = studentRequest.ApplicantStudent!.UserId;

            string actionStr = payload.Approved ? "accepted" : "rejected";
            
            _context.Notifications.Add(new Notification
            {
                UserId = senderUserId,
                Title = $"Request {actionStr}",
                Body = $"{studentProfile.User?.FullName ?? "A student"} has {actionStr} the request for project '{studentRequest.Project!.Title}'.",
                Kind = "project",
                ProjectCategory = studentRequest.Project.Category?.Name,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Request has been {actionStr}." });
        }

        /// <summary>
        /// Retrieves all incoming requests relevant to the logged-in student.
        /// Includes invitations to join other projects (StudentRequest) and 
        /// advisor requests interacting with projects owned by the student (AdvisorRequest).
        /// </summary>
        [HttpGet("requests/incoming")]
        public async Task<IActionResult> GetIncomingRequests()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var studentProfile = await _context.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            int profileId = studentProfile.Id;

            // 1. Requests sent to projects owned by current student (join-request visibility)
            var studentRequestsForOwner = await _context.StudentRequests
                .AsNoTracking()
                .Where(sr => sr.Project!.OwnerStudentId == profileId && sr.ApplicantStudentId != profileId)
                .Select(sr => new StudentIncomingRequestItemDTO
                {
                    RequestType = "StudentRequest",
                    RequestId = sr.Id,
                    Message = sr.Message ?? string.Empty,
                    Status = sr.Status.ToString(),
                    CreatedAt = sr.CreatedAt,
                    Project = new StudentIncomingRequestProjectDTO
                    {
                        Id = sr.Project!.Id,
                        Title = sr.Project.Title,
                        Description = sr.Project.Description,
                        Status = sr.Project.Status.ToString(),
                        TeamSize = sr.Project.TeamSize,
                        Category = new StudentIncomingRequestCategoryDTO
                        {
                            Id = sr.Project.Category!.Id,
                            Name = sr.Project.Category.Name,
                            Color = sr.Project.Category.Color
                        }
                    },
                    SenderStudent = new StudentIncomingRequestStudentSenderDTO
                    {
                        ProfileId = sr.ApplicantStudent!.Id,
                        UserId = sr.ApplicantStudent.UserId,
                        FullName = sr.ApplicantStudent.User!.FullName,
                        Email = sr.ApplicantStudent.User.Email,
                        Department = sr.ApplicantStudent.Department,
                        Year = sr.ApplicantStudent.Year,
                        Interests = sr.ApplicantStudent.Interests,
                        Bio = sr.ApplicantStudent.Bio,
                        GithubLink = sr.ApplicantStudent.GithubLink,
                        LinkedinLink = sr.ApplicantStudent.LinkedinLink,
                        Skills = _context.UserSkills
                            .Where(us => us.UserId == sr.ApplicantStudent.UserId)
                            .OrderBy(us => us.Skill!.SkillName)
                            .Select(us => us.Skill!.SkillName)
                            .ToList()
                    },
                    AdvisorSender = null
                })
                .ToListAsync();

            // 2. Fetch Advisor Requests for projects owned by the current student
            var advisorRequestsQuery = await _context.AdvisorRequests
                .AsNoTracking()
                .Where(ar => ar.Project!.OwnerStudentId == profileId)
                .Select(ar => new StudentIncomingRequestItemDTO
                {
                    RequestType = "AdvisorRequest",
                    RequestId = ar.Id,
                    Message = ar.Message ?? string.Empty,
                    Status = ar.Status.ToString(),
                    CreatedAt = ar.CreatedAt,
                    Project = new StudentIncomingRequestProjectDTO
                    {
                        Id = ar.Project!.Id,
                        Title = ar.Project.Title,
                        Description = ar.Project.Description,
                        Status = ar.Project.Status.ToString(),
                        TeamSize = ar.Project.TeamSize,
                        Category = new StudentIncomingRequestCategoryDTO
                        {
                            Id = ar.Project.Category!.Id,
                            Name = ar.Project.Category.Name,
                            Color = ar.Project.Category.Color
                        }
                    },
                    SenderStudent = null,
                    AdvisorSender = new StudentIncomingRequestAdvisorSenderDTO
                    {
                        ProfileId = ar.Advisor!.Id,
                        UserId = ar.Advisor.UserId,
                        FullName = ar.Advisor.User!.FullName,
                        Email = ar.Advisor.User.Email,
                        Department = ar.Advisor.Department,
                        AcademicTitle = ar.Advisor.AcademicTitle,
                        Expertise = ar.Advisor.Expertise,
                        ResearchInterests = ar.Advisor.ResearchInterests
                    }
                })
                .ToListAsync();

            // Combine both lists and sort them consecutively in memory natively
            var allRequests = studentRequestsForOwner
                .Concat(advisorRequestsQuery)
                .OrderByDescending(r => r.CreatedAt)
                .ToList();

            return Ok(allRequests);
        }





        /// <summary>
        /// Retrieves advisor requests sent by the logged-in student for their own projects.
        /// This endpoint is used by the "My Advisor Requests" page.
        /// </summary>
        [HttpGet("advisor-requests/my")]
        public async Task<IActionResult> GetMyAdvisorRequests()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var studentProfile = await _context.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            var advisorRequests = await _context.AdvisorRequests
                .AsNoTracking()
                .Where(ar => ar.Project!.OwnerStudentId == studentProfile.Id)
                .OrderByDescending(ar => ar.CreatedAt)
                .Select(ar => new StudentIncomingRequestItemDTO
                {
                    RequestType = "AdvisorRequest",
                    RequestId = ar.Id,
                    Message = ar.Message ?? string.Empty,
                    Status = ar.Status.ToString(),
                    CreatedAt = ar.CreatedAt,
                    Project = new StudentIncomingRequestProjectDTO
                    {
                        Id = ar.Project!.Id,
                        Title = ar.Project.Title,
                        Description = ar.Project.Description,
                        Status = ar.Project.Status.ToString(),
                        TeamSize = ar.Project.TeamSize,
                        Category = new StudentIncomingRequestCategoryDTO
                        {
                            Id = ar.Project.Category!.Id,
                            Name = ar.Project.Category.Name,
                            Color = ar.Project.Category.Color
                        }
                    },
                    SenderStudent = null,
                    AdvisorSender = new StudentIncomingRequestAdvisorSenderDTO
                    {
                        ProfileId = ar.Advisor!.Id,
                        UserId = ar.Advisor.UserId,
                        FullName = ar.Advisor.User!.FullName,
                        Email = ar.Advisor.User.Email,
                        Department = ar.Advisor.Department,
                        AcademicTitle = ar.Advisor.AcademicTitle,
                        Expertise = ar.Advisor.Expertise,
                        ResearchInterests = ar.Advisor.ResearchInterests
                    }
                })
                .ToListAsync();

            return Ok(advisorRequests);
        }

        /// <summary>
        /// Retrieves a unified announcement feed combining direct announcements, newly created project categories,
        /// advisor availabilities, and projects currently searching for teammates.
        /// </summary>
        [HttpGet("announcements/feed")]
        public async Task<IActionResult> GetAnnouncementFeed()
        {
            // Extract logged in student token
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid or corrupted token: unable to read user id." });
            }

            var studentProfile = await _context.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            if (studentProfile == null)
            {
                return NotFound(new { message = "Student profile not found for the requested user." });
            }

            var feedList = new List<StudentAnnouncementFeedItemDTO>();

            // 1. Direct System Announcements
            var directAnns = await _context.Announcements
                .Include(a => a.Publisher)
                .Include(a => a.Category)
                .AsNoTracking()
                .Select(a => new StudentAnnouncementFeedItemDTO
                {
                    AnnouncementType = "DirectAnnouncement",
                    ItemId = a.Id,
                    Title = a.Title ?? "System Announcement",
                    Description = a.Description,
                    CreatedAt = a.CreatedAt,
                    Publisher = a.Publisher != null ? new StudentAnnouncementPublisherDTO
                    {
                        UserId = a.Publisher.Id,
                        FullName = a.Publisher.FullName
                    } : null,
                    Category = a.Category != null ? new StudentAnnouncementCategoryDTO
                    {
                        Id = a.Category.Id,
                        Name = a.Category.Name,
                        Color = a.Category.Color
                    } : null
                })
                .ToListAsync();

            feedList.AddRange(directAnns);

            // 2. Project Category Announcements
            // ASSUMPTION/FALLBACK: Project categories do not have CreatedAt. We default to DateTime.MinValue
            // so they persistently remain at the bottom of the feed chronologically, serving as an evergreen directory.
            var catAnns = await _context.ProjectCategories
                .AsNoTracking()
                .Select(c => new StudentAnnouncementFeedItemDTO
                {
                    AnnouncementType = "CategoryAnnouncement",
                    ItemId = c.Id,
                    Title = "New Category: " + c.Name,
                    Description = c.Description ?? "A system category is available for project creation.",
                    CreatedAt = DateTime.MinValue,
                    Category = new StudentAnnouncementCategoryDTO
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description,
                        DefaultTeamSize = c.DefaultTeamSize,
                        DefaultBudget = c.DefaultBudget,
                        AdvisorRequired = c.AdvisorRequired,
                        EventDate = c.EventDate,
                        Color = c.Color
                    }
                })
                .ToListAsync();

            feedList.AddRange(catAnns);

            // 3. Advisor Availability Announcements
            // ASSUMPTION/FALLBACK: Advisor profiles do not log the exact second they clicked 'Available'.
            // We use DateTime.MinValue so these persistent calls for mentees rest at the bottom neutrally.
            var advisorAnns = await _context.AdvisorProfiles
                .Include(ap => ap.User)
                .AsNoTracking()
                .Where(ap => ap.AvailableForAdvising)
                .Select(ap => new StudentAnnouncementFeedItemDTO
                {
                    AnnouncementType = "AdvisorAvailabilityAnnouncement",
                    ItemId = ap.Id,
                    Title = "Advisor Available: " + ap.User!.FullName,
                    Description = "Looking to advise new projects.",
                    CreatedAt = DateTime.MinValue,
                    Advisor = new StudentAnnouncementAdvisorDTO
                    {
                        ProfileId = ap.Id,
                        UserId = ap.User.Id,
                        FullName = ap.User.FullName,
                        Email = ap.User.Email,
                        Department = ap.Department,
                        AcademicTitle = ap.AcademicTitle,
                        Expertise = ap.Expertise,
                        ResearchInterests = ap.ResearchInterests,
                        AvailableForAdvising = ap.AvailableForAdvising
                    }
                })
                .ToListAsync();

            feedList.AddRange(advisorAnns);

            // 4. Project Collaboration Announcements (Projects looking for members)
            // Rule: Status must be OPEN. Omitting projects the student *already* owns.
            var projAnns = await _context.Projects
                .Include(p => p.OwnerStudent).ThenInclude(os => os!.User)
                .Include(p => p.Category)
                .AsNoTracking()
                .Where(p => p.Status == ProjectStatus.OPEN && p.OwnerStudentId != studentProfile.Id)
                .Select(p => new StudentAnnouncementFeedItemDTO
                {
                    AnnouncementType = "ProjectCollaborationAnnouncement",
                    ItemId = p.Id,
                    Title = "Project Hiring: " + p.Title,
                    Description = p.Description ?? "We are looking for members.",
                    CreatedAt = p.UpdatedAt, // We use UpdatedAt to surface actively looking projects 
                    Category = p.Category != null ? new StudentAnnouncementCategoryDTO
                    {
                        Id = p.Category.Id,
                        Name = p.Category.Name,
                        Color = p.Category.Color
                    } : null,
                    Project = new StudentAnnouncementProjectDTO
                    {
                        ProjectId = p.Id,
                        Title = p.Title,
                        Description = p.Description,
                        Status = p.Status.ToString(),
                        TeamSize = p.TeamSize,
                        OwnerProfileId = p.OwnerStudent!.Id,
                        OwnerUserId = p.OwnerStudent.User!.Id,
                        OwnerFullName = p.OwnerStudent.User!.FullName,
                        OwnerEmail = p.OwnerStudent.User!.Email
                    }
                })
                .ToListAsync();

            feedList.AddRange(projAnns);

            // Sort finally by CreatedAt Descending
            var response = new StudentAnnouncementsFeedResponseDTO
            {
                Items = feedList.OrderByDescending(f => f.CreatedAt).ToList()
            };

            return Ok(response);
        }

        // ==========================================================
        // SEARCH ENDPOINTS (Student Search)
        // ==========================================================

        /// <summary>
        /// Searches for advisors, optionally filtering out those already requested/assigned for a given project.
        /// </summary>
        [HttpGet("search/advisors")]
        public async Task<IActionResult> SearchAdvisors([FromQuery] StudentSearchAdvisorsQueryDTO query)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var studentProfile = await _context.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (studentProfile == null) return NotFound(new { message = "Student profile not found." });

            var dbQuery = _context.AdvisorProfiles.Include(ap => ap.User).AsNoTracking().AsQueryable();

            int? targetCategoryId = null;

            // Project context constraints
            if (query.ProjectId.HasValue)
            {
                var project = await _context.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == query.ProjectId.Value);
                if (project == null) return NotFound(new { message = "Valid project context not found." });
                if (project.OwnerStudentId != studentProfile.Id) return StatusCode(403, new { message = "You can only search for advisors using your own project context." });

                targetCategoryId = project.CategoryId;

                if (targetCategoryId.HasValue)
                {
                    dbQuery = dbQuery.Where(ap => _context.AdvisorCategoryPreferences.Any(
                        acp => acp.AdvisorId == ap.Id && acp.CategoryId == targetCategoryId.Value
                    ));
                }

                // Exclude already requested or assigned advisors for this project
                var requestedOrAssignedAdvisorIds = await _context.AdvisorRequests
                    .Where(ar => ar.ProjectId == project.Id)
                    .Select(ar => ar.AdvisorId)
                    .ToListAsync();

                if (project.AdvisorAssignedId.HasValue)
                    requestedOrAssignedAdvisorIds.Add(project.AdvisorAssignedId.Value);

                if (requestedOrAssignedAdvisorIds.Any())
                {
                    dbQuery = dbQuery.Where(ap => !requestedOrAssignedAdvisorIds.Contains(ap.Id));
                }

                // Exclude advisors who already hold the max number of projects in this category
                // (assigned advisor on project rows). Preferences stay, but they must not appear selectable.
                if (targetCategoryId.HasValue)
                {
                    var maxPerAdvisor = await _context.ProjectCategories
                        .AsNoTracking()
                        .Where(c => c.Id == targetCategoryId.Value)
                        .Select(c => c.MaxProjectsPerAdvisor)
                        .FirstOrDefaultAsync();

                    if (maxPerAdvisor.HasValue && maxPerAdvisor.Value > 0)
                    {
                        var advisorIdsAtCapacity = await _context.Projects
                            .AsNoTracking()
                            .Where(p => p.CategoryId == targetCategoryId.Value && p.AdvisorAssignedId != null)
                            .GroupBy(p => p.AdvisorAssignedId!.Value)
                            .Where(g => g.Count() >= maxPerAdvisor.Value)
                            .Select(g => g.Key)
                            .ToListAsync();

                        if (advisorIdsAtCapacity.Count > 0)
                        {
                            dbQuery = dbQuery.Where(ap => !advisorIdsAtCapacity.Contains(ap.Id));
                        }
                    }
                }
            }

            // Filters
            if (!string.IsNullOrWhiteSpace(query.Department))
            {
                var searchDept = query.Department.ToLower();
                dbQuery = dbQuery.Where(ap => ap.Department != null && ap.Department.ToLower().Contains(searchDept));
            }
            if (query.AvailableForAdvising.HasValue)
                dbQuery = dbQuery.Where(ap => ap.AvailableForAdvising == query.AvailableForAdvising.Value);

            if (!string.IsNullOrWhiteSpace(query.AcademicTitle))
            {
                var searchTitle = query.AcademicTitle.ToLower();
                dbQuery = dbQuery.Where(ap => ap.AcademicTitle != null && ap.AcademicTitle.ToLower().Contains(searchTitle));
            }

            // Free text (q)
            if (!string.IsNullOrWhiteSpace(query.Q))
            {
                var search = query.Q.ToLower();
                dbQuery = dbQuery.Where(ap => 
                    (ap.User != null && ap.User.FullName.ToLower().Contains(search)) || 
                    (ap.Expertise != null && ap.Expertise.ToLower().Contains(search)) ||
                    (ap.ResearchInterests != null && ap.ResearchInterests.ToLower().Contains(search))
                );
            }

            // Sorting
            bool isDesc = query.SortOrder?.ToLower() == "desc";
            switch (query.SortBy?.ToLower())
            {
                case "department":
                    dbQuery = isDesc ? dbQuery.OrderByDescending(ap => ap.Department) : dbQuery.OrderBy(ap => ap.Department);
                    break;
                case "full_name":
                    dbQuery = isDesc ? dbQuery.OrderByDescending(ap => ap.User!.FullName) : dbQuery.OrderBy(ap => ap.User!.FullName);
                    break;
                default:
                    dbQuery = isDesc ? dbQuery.OrderByDescending(ap => ap.Id) : dbQuery.OrderBy(ap => ap.Id);
                    break;
            }

            // Pagination
            int pageSize = Math.Clamp(query.PageSize, 1, 100);
            int page = Math.Max(query.Page, 1);
            int totalCount = await dbQuery.CountAsync();
            int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var adProfiles = await dbQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // ─── ENRICH WITH AVAILABILITY ─────────────────────────────────────────
            Dictionary<int, AdvisorCategoryAvailabilityDTO>? availabilityMap = null;
            if (targetCategoryId.HasValue)
            {
                availabilityMap = await _availabilityService.EvaluateAvailabilityBulkAsync(
                    targetCategoryId.Value, 
                    adProfiles.Select(ap => ap.Id).ToList()
                );
            }

            var items = adProfiles.Select(ap => new StudentSearchAdvisorItemDTO
            {
                AdvisorProfileId = ap.Id,
                UserId = ap.UserId,
                FullName = ap.User!.FullName,
                Email = ap.User.Email,
                Department = ap.Department,
                AcademicTitle = ap.AcademicTitle,
                Expertise = ap.Expertise,
                ResearchInterests = ap.ResearchInterests,
                AvailableForAdvising = ap.AvailableForAdvising,
                CategoryAvailability = availabilityMap != null && availabilityMap.ContainsKey(ap.Id) 
                    ? availabilityMap[ap.Id] : null
            }).ToList();

            return Ok(new StudentSearchPaginationResponseDTO<StudentSearchAdvisorItemDTO>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            });
        }

        /// <summary>
        /// Searches projects to join, explicitly excluding projects the student owns or is already a member of.
        /// </summary>
        [HttpGet("search/projects")]
        public async Task<IActionResult> SearchProjects([FromQuery] StudentSearchProjectsQueryDTO query)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var studentProfile = await _context.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(sp => sp.UserId == userId);
            if (studentProfile == null) return NotFound(new { message = "Student profile not found." });

            var dbQuery = _context.Projects
                .Include(p => p.Category)
                .Include(p => p.OwnerStudent).ThenInclude(os => os!.User)
                .AsNoTracking()
                .AsQueryable();

            // EXCLUSION: Must exclude projects the logged in student currently owns
            dbQuery = dbQuery.Where(p => p.OwnerStudentId != studentProfile.Id);

            // EXCLUSION: Must exclude projects the logged in student is already a member of
            var alreadyMemberProjectIds = await _context.ProjectMembers
                .Where(pm => pm.StudentId == studentProfile.Id)
                .Select(pm => pm.ProjectId)
                .ToListAsync();

            if (alreadyMemberProjectIds.Any())
            {
                dbQuery = dbQuery.Where(p => !alreadyMemberProjectIds.Contains(p.Id));
            }

            // Defaults + Filters 
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                // Explicitly requested a status
                if (Enum.TryParse<ProjectStatus>(query.Status, true, out var parsedStatus))
                {
                    dbQuery = dbQuery.Where(p => p.Status == parsedStatus);
                }
            }
            else
            {
                // Fallback default: Just show OPEN projects when searching to join
                dbQuery = dbQuery.Where(p => p.Status == ProjectStatus.OPEN);
            }

            if (query.CategoryId.HasValue)
                dbQuery = dbQuery.Where(p => p.CategoryId == query.CategoryId.Value);

            if (!string.IsNullOrWhiteSpace(query.CategoryName))
            {
                var searchCat = query.CategoryName.ToLower();
                dbQuery = dbQuery.Where(p => p.Category != null && p.Category.Name.ToLower().Contains(searchCat));
            }

            if (query.AdvisorRequired.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.Category != null && p.Category.AdvisorRequired == query.AdvisorRequired.Value);
            }

            if (query.MinTeamSize.HasValue)
                dbQuery = dbQuery.Where(p => p.TeamSize >= query.MinTeamSize.Value);

            if (query.MaxTeamSize.HasValue)
                dbQuery = dbQuery.Where(p => p.TeamSize <= query.MaxTeamSize.Value);

            // Free text (q)
            if (!string.IsNullOrWhiteSpace(query.Q))
            {
                var search = query.Q.ToLower();
                dbQuery = dbQuery.Where(p => 
                    p.Title.ToLower().Contains(search) || 
                    (p.Description != null && p.Description.ToLower().Contains(search))
                );
            }

            // Sorting
            bool isDesc = query.SortOrder?.ToLower() == "desc";
            switch (query.SortBy?.ToLower())
            {
                case "title":
                    dbQuery = isDesc ? dbQuery.OrderByDescending(p => p.Title) : dbQuery.OrderBy(p => p.Title);
                    break;
                case "team_size":
                    dbQuery = isDesc ? dbQuery.OrderByDescending(p => p.TeamSize) : dbQuery.OrderBy(p => p.TeamSize);
                    break;
                case "created_at":
                default:
                    // Default fallback is Chronological Descending so newest projects are seen first
                    dbQuery = isDesc ? dbQuery.OrderByDescending(p => p.CreatedAt) : dbQuery.OrderByDescending(p => p.CreatedAt);
                    break;
            }

            // Pagination
            int pageSize = Math.Clamp(query.PageSize, 1, 100);
            int page = Math.Max(query.Page, 1);
            int totalCount = await dbQuery.CountAsync();
            int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            // Because calculating MemberCount per row can't easily be done directly on the Project model without a 
            // navigation property inside the select projection, we fetch the subset and map the count memory-cheaply
            var paginatedProjects = await dbQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Retrieve Member Counts for the paginated slice
            var projectIds = paginatedProjects.Select(p => p.Id).ToList();
            var memberCounts = await _context.ProjectMembers
                .Where(pm => projectIds.Contains(pm.ProjectId))
                .GroupBy(pm => pm.ProjectId)
                .Select(g => new { ProjectId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ProjectId, x => x.Count);

            // Structure safe DTO response
            // Fetch advisors uniquely if attached
            var assignedAdvisorsIds = paginatedProjects
                .Where(p => p.AdvisorAssignedId != null)
                .Select(p => p.AdvisorAssignedId!.Value)
                .ToList();
            var advisorsMap = await _context.AdvisorProfiles.Include(ap => ap.User).Where(ap => assignedAdvisorsIds.Contains(ap.Id)).ToDictionaryAsync(ap => ap.Id);

            var alreadyRequestedProjectIds = await _context.StudentRequests
                .Where(sr => sr.ApplicantStudentId == studentProfile.Id && projectIds.Contains(sr.ProjectId))
                .Select(sr => sr.ProjectId)
                .ToListAsync();

            var items = paginatedProjects.Select(p => new StudentSearchProjectItemDTO
            {
                ProjectId = p.Id,
                Title = p.Title,
                Description = p.Description,
                TeamSize = p.TeamSize,
                Status = p.Status.ToString(),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                CurrentMemberCount = memberCounts.ContainsKey(p.Id) ? memberCounts[p.Id] : 0,
                AlreadyRequested = alreadyRequestedProjectIds.Contains(p.Id),
                Category = new StudentSearchProjectCategoryDTO
                {
                    Id = p.Category!.Id,
                    Name = p.Category.Name,
                    AdvisorRequired = p.Category.AdvisorRequired,
                    Color = p.Category.Color
                },
                Owner = new StudentSearchProjectOwnerDTO
                {
                    ProfileId = p.OwnerStudent!.Id,
                    UserId = p.OwnerStudent.UserId,
                    FullName = p.OwnerStudent.User!.FullName,
                    Department = p.OwnerStudent.Department
                },
                Advisor = p.AdvisorAssignedId.HasValue && advisorsMap.ContainsKey(p.AdvisorAssignedId.Value) ? new StudentSearchProjectAdvisorDTO
                {
                    ProfileId = p.AdvisorAssignedId.Value,
                    FullName = advisorsMap[p.AdvisorAssignedId.Value].User!.FullName
                } : null
            }).ToList();

            return Ok(new StudentSearchPaginationResponseDTO<StudentSearchProjectItemDTO>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            });
        }
    }
}
