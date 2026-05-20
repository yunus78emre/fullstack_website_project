using backend.Data;
using backend.DTOs.Advisor;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    /// <summary>
    /// Handles advisor-area data retrieval from the database.
    /// </summary>
    public class AdvisorProfileService : IAdvisorProfileService
    {
        private readonly AppDbContext _context;
        private readonly IAdvisorAvailabilityService _availabilityService;

        public AdvisorProfileService(AppDbContext context, IAdvisorAvailabilityService availabilityService)
        {
            _context = context;
            _availabilityService = availabilityService;
        }

        /// <inheritdoc />
        public async Task<AdvisorProfileResponseDTO?> GetProfileByUserIdAsync(int userId)
        {
            var profile = await _context.AdvisorProfiles
                .Include(ap => ap.User)
                    .ThenInclude(u => u!.Role)
                .AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (profile == null || profile.User == null)
                return null;

            var skills = await _context.UserSkills
                .AsNoTracking()
                .Where(us => us.UserId == profile.UserId)
                .OrderBy(us => us.Skill!.SkillName)
                .Select(us => us.Skill!.SkillName)
                .ToListAsync();

            return new AdvisorProfileResponseDTO
            {
                User = new AdvisorProfileUserInfoDTO
                {
                    Id = profile.User.Id,
                    FullName = profile.User.FullName,
                    Email = profile.User.Email,
                    CreatedAt = profile.User.CreatedAt,
                    RoleName = profile.User.Role?.RoleName ?? "Advisor"
                },
                Profile = new AdvisorProfileDetailsDTO
                {
                    Id = profile.Id,
                    UserId = profile.UserId,
                    Department = profile.Department,
                    AcademicTitle = profile.AcademicTitle,
                    Expertise = profile.Expertise,
                    ResearchInterests = profile.ResearchInterests,
                    AvailableForAdvising = profile.AvailableForAdvising,
                    Skills = skills
                }
            };
        }

        /// <inheritdoc />
        public async Task<List<AdvisorProjectListItemDTO>?> GetProjectsByUserIdAsync(int userId)
        {
            // Resolve advisor profile ID from user ID
            var advisorProfile = await _context.AdvisorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (advisorProfile == null)
                return null;

            int advisorProfileId = advisorProfile.Id;

            // Single query: fetch all projects assigned to this advisor with full projections.
            // Members and skills are fetched as correlated subqueries inside .Select()
            // to avoid N+1 and keep everything in one round-trip.
            var projects = await _context.Projects
                .AsNoTracking()
                .Where(p => p.AdvisorAssignedId == advisorProfileId)
                .Select(p => new AdvisorProjectListItemDTO
                {
                    ProjectId = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    TeamSize = p.TeamSize,
                    Status = p.Status.ToString(),
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    Category = p.Category != null ? new AdvisorProjectCategoryDTO
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

                    Owner = new AdvisorProjectOwnerDTO
                    {
                        ProfileId = p.OwnerStudent!.Id,
                        UserId = p.OwnerStudent.UserId,
                        FullName = p.OwnerStudent.User!.FullName,
                        Email = p.OwnerStudent.User!.Email,
                        Department = p.OwnerStudent.Department,
                        Year = p.OwnerStudent.Year
                    },

                    Advisor = new AdvisorProjectAdvisorDTO
                    {
                        ProfileId = p.AdvisorAssigned!.Id,
                        UserId = p.AdvisorAssigned.UserId,
                        FullName = p.AdvisorAssigned.User!.FullName,
                        Email = p.AdvisorAssigned.User!.Email,
                        Department = p.AdvisorAssigned.Department,
                        AcademicTitle = p.AdvisorAssigned.AcademicTitle,
                        Expertise = p.AdvisorAssigned.Expertise,
                        ResearchInterests = p.AdvisorAssigned.ResearchInterests,
                        AvailableForAdvising = p.AdvisorAssigned.AvailableForAdvising
                    },

                    Members = _context.ProjectMembers
                        .Where(pm => pm.ProjectId == p.Id)
                        .Select(pm => new AdvisorProjectMemberDTO
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
                        .Select(ps => new AdvisorProjectSkillDTO
                        {
                            SkillId = ps.SkillId ?? 0,
                            SkillName = ps.Skill!.SkillName
                        }).ToList()
                })
                .ToListAsync();

            // Compute TotalMemberCount in memory (owner + distinct members)
            foreach (var project in projects)
            {
                var distinctMemberIds = project.Members.Select(m => m.StudentProfileId).ToHashSet();
                distinctMemberIds.Add(project.Owner.ProfileId);
                project.TotalMemberCount = distinctMemberIds.Count;
            }

            return projects;
        }

        // ==========================================================
        // REQUEST OPERATIONS
        // ==========================================================

        /// <inheritdoc />
        public async Task<(AdvisorSendRequestResponseDTO? Response, int StatusCode, string? ErrorMessage)>
            SendAdvisorRequestAsync(int userId, AdvisorSendRequestRequestDTO request)
        {
            // 1. Resolve advisor profile
            var advisorProfile = await _context.AdvisorProfiles
                .Include(ap => ap.User)
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (advisorProfile == null || advisorProfile.User == null)
                return (null, 404, "Advisor profile not found for the current user.");

            // 2. Validate project exists and load related data
            var project = await _context.Projects
                .Include(p => p.OwnerStudent)
                    .ThenInclude(os => os!.User)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
                return (null, 404, "The specified project does not exist.");

            if (project.OwnerStudent == null || project.OwnerStudent.User == null)
                return (null, 400, "The specified project does not have a valid student owner.");

            // 3. Block requests to projects with terminal statuses.
            // COMPLETED and CANCELLED projects are no longer accepting advisor involvement.
            if (project.Status == ProjectStatus.COMPLETED)
                return (null, 400, "Cannot send a request to a completed project.");

            if (project.Status == ProjectStatus.CANCELLED)
                return (null, 400, "Cannot send a request to a cancelled project.");

            // 4. Block if this advisor is already assigned to the project
            if (project.AdvisorAssignedId == advisorProfile.Id)
                return (null, 409, "You are already assigned as the advisor for this project.");

            // 5. Block duplicate requests (same project + same advisor).
            // Checked before insert to return a clean business error
            // instead of letting the DB UNIQUE constraint throw an exception.
            bool requestExists = await _context.AdvisorRequests
                .AnyAsync(ar => ar.ProjectId == request.ProjectId && ar.AdvisorId == advisorProfile.Id);

            if (requestExists)
                return (null, 409, "You have already sent a request for this project.");

            // ─── CATEGORY CAPACITY ENFORCEMENT ────────────────────────────────────
            if (project.CategoryId.HasValue)
            {
                bool advisorAcceptsCategory = await _context.AdvisorCategoryPreferences
                    .AsNoTracking()
                    .AnyAsync(x => x.AdvisorId == advisorProfile.Id && x.CategoryId == project.CategoryId.Value);
                if (!advisorAcceptsCategory)
                {
                    return (null, 400, "You are not available for this project's category.");
                }

                var (isAvailable, message) = await _availabilityService.CheckAvailabilityAsync(advisorProfile.Id, project.CategoryId.Value);
                if (!isAvailable)
                {
                    return (null, 400, message);
                }
            }

            // 6. Create the advisor request — status is PENDING, NOT auto-assigning
            var advisorRequest = new AdvisorRequest
            {
                ProjectId = request.ProjectId,
                AdvisorId = advisorProfile.Id,
                Message = request.Message,
                Status = RequestStatus.PENDING,
                CreatedAt = DateTime.UtcNow
            };

            _context.AdvisorRequests.Add(advisorRequest);
            await _context.SaveChangesAsync();

            // 7. Build response DTO
            var responseDto = new AdvisorSendRequestResponseDTO
            {
                AdvisorRequestId = advisorRequest.Id,
                Message = advisorRequest.Message ?? string.Empty,
                Status = advisorRequest.Status.ToString(),
                CreatedAt = advisorRequest.CreatedAt,
                Project = new AdvisorSendRequestProjectDTO
                {
                    Id = project.Id,
                    Title = project.Title,
                    Status = project.Status.ToString(),
                    Category = project.Category != null ? new AdvisorSendRequestCategoryDTO
                    {
                        Id = project.Category.Id,
                        Name = project.Category.Name,
                        Color = project.Category.Color
                    } : null
                },
                OwnerStudent = new AdvisorSendRequestOwnerStudentDTO
                {
                    ProfileId = project.OwnerStudent.Id,
                    FullName = project.OwnerStudent.User.FullName,
                    Email = project.OwnerStudent.User.Email
                },
                Advisor = new AdvisorSendRequestAdvisorDTO
                {
                    ProfileId = advisorProfile.Id,
                    FullName = advisorProfile.User.FullName,
                    Email = advisorProfile.User.Email,
                    Department = advisorProfile.Department
                }
            };

            return (responseDto, 201, null);
        }

        /// <inheritdoc />
        public async Task<AdvisorIncomingRequestsResponseDTO?> GetIncomingRequestsByUserIdAsync(int userId)
        {
            // 1. Resolve advisor profile
            var advisorProfile = await _context.AdvisorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (advisorProfile == null)
                return null;

            int advisorProfileId = advisorProfile.Id;

            // 2. Query incoming requests with all required relations
            // Sorting by created_at descending (newest first)
            var requestsQuery = _context.AdvisorRequests
                .AsNoTracking()
                .Where(ar => ar.AdvisorId == advisorProfileId)
                .OrderByDescending(ar => ar.CreatedAt)
                .Select(ar => new AdvisorIncomingRequestItemDTO
                {
                    AdvisorRequestId = ar.Id,
                    Message = ar.Message,
                    Status = ar.Status.ToString(),
                    CreatedAt = ar.CreatedAt,

                    Project = new AdvisorIncomingRequestProjectDTO
                    {
                        Id = ar.Project!.Id,
                        Title = ar.Project.Title,
                        Description = ar.Project.Description,
                        TeamSize = ar.Project.TeamSize,
                        Status = ar.Project.Status.ToString(),
                        CreatedAt = ar.Project.CreatedAt,
                        UpdatedAt = ar.Project.UpdatedAt,
                        AssignedAdvisorId = ar.Project.AdvisorAssignedId,
                        HasAssignedAdvisor = ar.Project.AdvisorAssignedId.HasValue,
                        
                        Category = ar.Project.Category != null ? new AdvisorIncomingRequestCategoryDTO
                        {
                            Id = ar.Project.Category.Id,
                            Name = ar.Project.Category.Name,
                            Description = ar.Project.Category.Description,
                            DefaultTeamSize = ar.Project.Category.DefaultTeamSize,
                            DefaultBudget = ar.Project.Category.DefaultBudget,
                            AdvisorRequired = ar.Project.Category.AdvisorRequired,
                            EventDate = ar.Project.Category.EventDate,
                            Color = ar.Project.Category.Color
                        } : null,

                        Skills = _context.ProjectSkills
                            .Where(ps => ps.ProjectId == ar.ProjectId)
                            .Select(ps => new AdvisorIncomingRequestSkillDTO
                            {
                                SkillId = ps.SkillId ?? 0,
                                SkillName = ps.Skill!.SkillName
                            }).ToList(),

                        TotalMemberCount = _context.ProjectMembers.Count(pm => pm.ProjectId == ar.ProjectId)
                    },

                    SenderStudent = new AdvisorIncomingRequestOwnerStudentDTO
                    {
                        ProfileId = ar.Project.OwnerStudent!.Id,
                        UserId = ar.Project.OwnerStudent.UserId,
                        FullName = ar.Project.OwnerStudent.User!.FullName,
                        Email = ar.Project.OwnerStudent.User.Email,
                        Department = ar.Project.OwnerStudent.Department,
                        Year = ar.Project.OwnerStudent.Year,
                        Interests = ar.Project.OwnerStudent.Interests,
                        Bio = ar.Project.OwnerStudent.Bio,
                        GithubLink = ar.Project.OwnerStudent.GithubLink,
                        LinkedinLink = ar.Project.OwnerStudent.LinkedinLink
                    },

                    Advisor = new AdvisorIncomingRequestAdvisorDTO
                    {
                        ProfileId = ar.Advisor!.Id,
                        UserId = ar.Advisor.UserId,
                        FullName = ar.Advisor.User!.FullName,
                        Email = ar.Advisor.User.Email,
                        Department = ar.Advisor.Department,
                        AcademicTitle = ar.Advisor.AcademicTitle,
                        Expertise = ar.Advisor.Expertise,
                        ResearchInterests = ar.Advisor.ResearchInterests,
                        AvailableForAdvising = ar.Advisor.AvailableForAdvising
                    }
                });

            var requestList = await requestsQuery.ToListAsync();

            return new AdvisorIncomingRequestsResponseDTO
            {
                Requests = requestList
            };
        }

        // ==========================================================
        // SEARCH OPERATIONS
        // ==========================================================

        /// <inheritdoc />
        public async Task<AdvisorSearchProjectsResponseDTO?> SearchProjectsAsync(int userId, AdvisorSearchProjectsQueryDTO query)
        {
            // 1. Resolve advisor profile
            var advisorProfile = await _context.AdvisorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (advisorProfile == null)
                return null;

            int advisorProfileId = advisorProfile.Id;

            // 2. Build base query — Only search projects that are student-owned
            var projectsQuery = _context.Projects.AsQueryable();

            // ── Basic Filters ──────────────────────────────────────────────────

            // Free text search (q)
            if (!string.IsNullOrWhiteSpace(query.Q))
            {
                var term = query.Q.ToLower();
                projectsQuery = projectsQuery.Where(p =>
                    p.Title.ToLower().Contains(term) ||
                    (p.Description != null && p.Description.ToLower().Contains(term)) ||
                    (p.Category != null && p.Category.Name.ToLower().Contains(term)) ||
                    (p.OwnerStudent != null && p.OwnerStudent.User!.FullName.ToLower().Contains(term))
                );
            }

            // Category filters
            if (query.CategoryId.HasValue)
                projectsQuery = projectsQuery.Where(p => p.CategoryId == query.CategoryId);
            
            if (!string.IsNullOrWhiteSpace(query.CategoryName))
                projectsQuery = projectsQuery.Where(p => p.Category != null && p.Category.Name == query.CategoryName);

            // Status filter
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                if (Enum.TryParse<ProjectStatus>(query.Status, true, out var status))
                {
                    projectsQuery = projectsQuery.Where(p => p.Status == status);
                }
            }
            else
            {
                // DEFAULT BUSINESS RULE: Only show OPEN projects by default, 
                // and never show COMPLETED or CANCELLED projects in search results 
                // unless explicitly searched for (which usually advisors wouldn't do).
                projectsQuery = projectsQuery.Where(p => 
                    p.Status == ProjectStatus.OPEN || 
                    p.Status == ProjectStatus.FULL || 
                    p.Status == ProjectStatus.IN_PROGRESS
                );
            }

            // Advisor logic filters
            if (query.AdvisorRequired.HasValue)
                projectsQuery = projectsQuery.Where(p => p.Category != null && p.Category.AdvisorRequired == query.AdvisorRequired);

            if (query.HasAssignedAdvisor.HasValue)
                projectsQuery = projectsQuery.Where(p => p.AdvisorAssignedId.HasValue == query.HasAssignedAdvisor);

            if (query.OnlyWithoutAdvisor == true)
                projectsQuery = projectsQuery.Where(p => p.AdvisorAssignedId == null);

            // Team size filters
            if (query.MinTeamSize.HasValue)
                projectsQuery = projectsQuery.Where(p => p.TeamSize >= query.MinTeamSize);
            
            if (query.MaxTeamSize.HasValue)
                projectsQuery = projectsQuery.Where(p => p.TeamSize <= query.MaxTeamSize);

            // Metadata filters
            if (!string.IsNullOrWhiteSpace(query.OwnerDepartment))
                projectsQuery = projectsQuery.Where(p => p.OwnerStudent != null && p.OwnerStudent.Department == query.OwnerDepartment);

            if (query.EventDateFrom.HasValue)
                projectsQuery = projectsQuery.Where(p => p.Category != null && p.Category.EventDate >= query.EventDateFrom);

            if (query.EventDateTo.HasValue)
                projectsQuery = projectsQuery.Where(p => p.Category != null && p.Category.EventDate <= query.EventDateTo);

            // ── Exclusion Logic ────────────────────────────────────────────────

            // Rule: Exclude projects where the advisor is ALREADY assigned
            projectsQuery = projectsQuery.Where(p => p.AdvisorAssignedId != advisorProfileId);

            // Rule: Exclude projects where the advisor has ALREADY sent a request
            // This prevents the search from being cluttered with projects they are already waiting on.
            projectsQuery = projectsQuery.Where(p => !_context.AdvisorRequests.Any(ar => 
                ar.AdvisorId == advisorProfileId && ar.ProjectId == p.Id
            ));

            // ── Sorting ────────────────────────────────────────────────────────

            bool isDesc = query.SortOrder?.ToLower() == "desc";
            projectsQuery = (query.SortBy?.ToLower()) switch
            {
                "title" => isDesc ? projectsQuery.OrderByDescending(p => p.Title) : projectsQuery.OrderBy(p => p.Title),
                "status" => isDesc ? projectsQuery.OrderByDescending(p => p.Status) : projectsQuery.OrderBy(p => p.Status),
                "category_name" => isDesc ? projectsQuery.OrderByDescending(p => p.Category!.Name) : projectsQuery.OrderBy(p => p.Category!.Name),
                "owner_name" => isDesc ? projectsQuery.OrderByDescending(p => p.OwnerStudent!.User!.FullName) : projectsQuery.OrderBy(p => p.OwnerStudent!.User!.FullName),
                _ => isDesc ? projectsQuery.OrderByDescending(p => p.CreatedAt) : projectsQuery.OrderBy(p => p.CreatedAt)
            };

            // ── Pagination ─────────────────────────────────────────────────────

            int totalCount = await projectsQuery.CountAsync();
            int pageSize = Math.Clamp(query.PageSize, 1, 100);
            int page = Math.Max(query.Page, 1);
            int totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            // ── Projection ─────────────────────────────────────────────────────

            // ─── Projection & Availability Enrichment ───────────────────────────
            var initialItems = await projectsQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    Project = p,
                    CategoryId = p.CategoryId,
                    Owner = p.OwnerStudent,
                    OwnerUser = p.OwnerStudent!.User,
                    Category = p.Category,
                    Advisor = p.AdvisorAssigned,
                    AdvisorUser = p.AdvisorAssigned != null ? p.AdvisorAssigned.User : null
                })
                .ToListAsync();

            // Bulk fetch member counts and skills to avoid N+1
            var projectIds = initialItems.Select(x => x.Project.Id).ToList();
            var memberCounts = await _context.ProjectMembers
                .Where(pm => projectIds.Contains(pm.ProjectId))
                .GroupBy(pm => pm.ProjectId)
                .Select(g => new { ProjectId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ProjectId, x => x.Count);

            var projectSkills = await _context.ProjectSkills
                .Include(ps => ps.Skill)
                .Where(ps => ps.ProjectId.HasValue && projectIds.Contains(ps.ProjectId.Value))
                .ToListAsync();

            // Bulk fetch availability for each distinct category found in the result set
            var distinctCategoryIds = initialItems
                .Where(x => x.CategoryId.HasValue)
                .Select(x => x.CategoryId!.Value)
                .Distinct()
                .ToList();

            var availabilityMap = new Dictionary<int, AdvisorCategoryAvailabilityDTO>();
            foreach (var catId in distinctCategoryIds)
            {
                var availability = await _availabilityService.GetAdvisorAvailabilityAsync((int)advisorProfile.Id, (int)catId);
                availabilityMap[catId] = availability;
            }

            var items = initialItems.Select(x => new AdvisorSearchProjectItemDTO
            {
                ProjectId = x.Project.Id,
                Title = x.Project.Title,
                Description = x.Project.Description,
                TeamSize = x.Project.TeamSize,
                Status = x.Project.Status.ToString(),
                CreatedAt = x.Project.CreatedAt,
                UpdatedAt = x.Project.UpdatedAt,
                
                CurrentMemberCount = memberCounts.GetValueOrDefault(x.Project.Id, 0),

                // Business Logic Flags
                IsRequestable = x.Project.Status == ProjectStatus.OPEN && x.Project.AdvisorAssignedId == null,
                AlreadyAssigned = false, 
                AlreadyRequested = false,

                // NEW: Capacity Information
                CategoryAvailability = x.CategoryId.HasValue && availabilityMap.ContainsKey(x.CategoryId.Value) 
                    ? availabilityMap[x.CategoryId.Value] : null,

                Category = x.Category != null ? new AdvisorSearchProjectCategoryDTO
                {
                    Id = x.Category.Id,
                    Name = x.Category.Name,
                    Description = x.Category.Description,
                    DefaultTeamSize = x.Category.DefaultTeamSize,
                    DefaultBudget = x.Category.DefaultBudget,
                    AdvisorRequired = x.Category.AdvisorRequired,
                    EventDate = x.Category.EventDate,
                    Color = x.Category.Color
                } : null,

                Owner = new AdvisorSearchProjectOwnerDTO
                {
                    ProfileId = x.Owner!.Id,
                    UserId = x.Owner.UserId,
                    FullName = x.OwnerUser!.FullName,
                    Email = x.OwnerUser.Email,
                    Department = x.Owner.Department,
                    Year = x.Owner.Year
                },

                Advisor = x.Advisor != null ? new AdvisorSearchProjectAdvisorDTO
                {
                    ProfileId = x.Advisor.Id,
                    UserId = x.Advisor.UserId,
                    FullName = x.AdvisorUser!.FullName,
                    Email = x.AdvisorUser.Email
                } : null,

                Skills = projectSkills
                    .Where(ps => ps.ProjectId == x.Project.Id)
                    .Select(ps => new AdvisorSearchProjectSkillDTO
                    {
                        SkillId = ps.SkillId ?? 0,
                        SkillName = ps.Skill!.SkillName
                    }).ToList()
            }).ToList();

            return new AdvisorSearchProjectsResponseDTO
            {
                Items = items,
                Pagination = new AdvisorSearchPaginationDTO
                {
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = totalPages
                }
            };
        }

        /// <inheritdoc />
        public async Task<AdvisorAnnouncementsFeedResponseDTO?> GetAnnouncementsFeedAsync(int userId)
        {
            // 1. Resolve advisor profile
            var advisorProfile = await _context.AdvisorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (advisorProfile == null)
                return null;

            int advisorProfileId = advisorProfile.Id;

            // ── Source A: Direct Announcements ───────────────────────────────────

            var directAnnouncements = await _context.Announcements
                .AsNoTracking()
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AdvisorAnnouncementFeedItemDTO
                {
                    AnnouncementType = "DirectAnnouncement",
                    ItemId = a.Id,
                    Title = a.Title ?? "Untitled Announcement",
                    Description = a.Description,
                    CreatedAt = a.CreatedAt,
                    Summary = "System Announcement",
                    DirectDetail = new AdvisorDirectAnnouncementDetailDTO
                    {
                        PublisherUserId = a.PublishedBy,
                        PublisherFullName = a.Publisher != null ? a.Publisher.FullName : "System",
                        CategoryId = a.CategoryId,
                        CategoryName = a.Category != null ? a.Category.Name : null
                    }
                })
                .ToListAsync();

            // ── Source B: Category Announcements ─────────────────────────────────

            // NOTE: project_categories does not have a created_at field in the schema.
            // These will be appended at the end of the feed as per implementation plan.
            var categoryAnnouncements = await _context.ProjectCategories
                .AsNoTracking()
                .Select(c => new AdvisorAnnouncementFeedItemDTO
                {
                    AnnouncementType = "CategoryAnnouncement",
                    ItemId = c.Id,
                    Title = $"New Category Available: {c.Name}",
                    Description = c.Description,
                    CreatedAt = null, // No timestamp in DB
                    Summary = "Project Category Discovery",
                    CategoryDetail = new AdvisorCategoryAnnouncementDetailDTO
                    {
                        CategoryId = c.Id,
                        DefaultTeamSize = c.DefaultTeamSize,
                        DefaultBudget = c.DefaultBudget,
                        AdvisorRequired = c.AdvisorRequired,
                        EventDate = c.EventDate
                    }
                })
                .ToListAsync();

            // ── Source C: Project Opportunities ──────────────────────────────────
            
            // BUSINESS RULES:
            // - Show only student-owned projects (OwnerStudentId != 0)
            // - Show only projects with status OPEN
            // - Show only projects where advisor_assigned_id IS NULL
            // - Exclude projects where current advisor has already sent a request
            var initialProjects = await _context.Projects
                .AsNoTracking()
                .Where(p => p.OwnerStudentId != 0 &&
                           p.Status == ProjectStatus.OPEN &&
                           p.AdvisorAssignedId == null &&
                           !_context.AdvisorRequests.Any(ar => ar.AdvisorId == advisorProfileId && ar.ProjectId == p.Id))
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    Project = p,
                    Category = p.Category,
                    Owner = p.OwnerStudent,
                    OwnerUser = p.OwnerStudent!.User,
                    ProjectId = p.Id,
                    CategoryId = p.CategoryId
                })
                .Take(25) // Limit feed size
                .ToListAsync();

            var opProjectIds = initialProjects.Select(x => x.ProjectId).ToList();
            var opMemberCounts = await _context.ProjectMembers
                .Where(pm => opProjectIds.Contains(pm.ProjectId))
                .GroupBy(pm => pm.ProjectId)
                .Select(g => new { ProjectId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ProjectId, x => x.Count);

            var opProjectSkills = await _context.ProjectSkills
                .Include(ps => ps.Skill)
                .Where(ps => ps.ProjectId.HasValue && opProjectIds.Contains(ps.ProjectId.Value))
                .ToListAsync();

            // Bulk fetch availability for each distinct category found in the result set
            var opDistinctCategoryIds = initialProjects
                .Where(x => x.CategoryId.HasValue)
                .Select(x => x.CategoryId!.Value)
                .Distinct()
                .ToList();

            var opAvailabilityMap = new Dictionary<int, AdvisorCategoryAvailabilityDTO>();
            foreach (var catId in opDistinctCategoryIds)
            {
                var availability = await _availabilityService.GetAdvisorAvailabilityAsync((int)advisorProfile.Id, (int)catId);
                opAvailabilityMap[catId] = availability;
            }

            var projectsLookingForAdvisors = initialProjects.Select(x => new AdvisorAnnouncementFeedItemDTO
            {
                AnnouncementType = "ProjectLookingForAdvisorAnnouncement",
                ItemId = x.ProjectId,
                Title = $"Project Opportunity: {x.Project.Title}",
                Description = x.Project.Description,
                CreatedAt = x.Project.CreatedAt,
                Summary = $"Looking for Advisor - {x.Category!.Name}",
                ProjectDetail = new AdvisorProjectOpportunityDetailDTO
                {
                    ProjectId = x.ProjectId,
                    Status = x.Project.Status.ToString(),
                    TeamSize = x.Project.TeamSize,
                    UpdatedAt = x.Project.UpdatedAt,
                    CurrentMemberCount = opMemberCounts.GetValueOrDefault(x.ProjectId, 0),
                    AlreadyRequested = false,
                    
                    // NEW: Capacity Information
                    CategoryAvailability = x.CategoryId.HasValue && opAvailabilityMap.ContainsKey(x.CategoryId.Value) 
                        ? opAvailabilityMap[x.CategoryId.Value] : null,

                    Category = new AdvisorAnnouncementCategoryDTO
                    {
                        Id = x.Category!.Id,
                        Name = x.Category.Name,
                        AdvisorRequired = x.Category.AdvisorRequired,
                        EventDate = x.Category.EventDate,
                        Color = x.Category.Color
                    },
                    Owner = new AdvisorAnnouncementOwnerStudentDTO
                    {
                        ProfileId = x.Owner!.Id,
                        UserId = x.Owner.UserId,
                        FullName = x.OwnerUser!.FullName,
                        Email = x.OwnerUser.Email,
                        Department = x.Owner.Department,
                        Year = x.Owner.Year
                    },
                    Skills = opProjectSkills
                        .Where(ps => ps.ProjectId == x.ProjectId)
                        .Select(ps => new AdvisorAnnouncementSkillDTO
                        {
                            SkillId = ps.SkillId ?? 0,
                            SkillName = ps.Skill!.SkillName
                        }).ToList()
                }
            }).ToList();

            // ── Aggregation & Sorting ───────────────────────────────────────────

            // 1. Combine timestamped sources: Direct Announcements + Project Opportunities
            var timestampedItems = directAnnouncements
                .Concat(projectsLookingForAdvisors)
                .OrderByDescending(i => i.CreatedAt)
                .ToList();

            // 2. Append untimestamped items (Categories) at the end
            var finalFeed = timestampedItems
                .Concat(categoryAnnouncements)
                .ToList();

            return new AdvisorAnnouncementsFeedResponseDTO
            {
                Items = finalFeed
            };
        }

        /// <inheritdoc />
        public async Task<List<AdvisorCategoryAvailabilityDTO>?> GetMyAvailabilityAsync(int userId)
        {
            var advisorProfile = await _context.AdvisorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (advisorProfile == null) return null;

            // Return availability for all existing categories so advisors can
            // explicitly see/select where they want to work.
            var categoryIds = await _context.ProjectCategories
                .AsNoTracking()
                .Select(c => c.Id)
                .ToListAsync();

            if (!categoryIds.Any()) return new List<AdvisorCategoryAvailabilityDTO>();

            var selectedCategoryIds = await _context.AdvisorCategoryPreferences
                .AsNoTracking()
                .Where(x => x.AdvisorId == advisorProfile.Id)
                .Select(x => x.CategoryId)
                .ToHashSetAsync();

            // Calculate availability for each category
            var availabilityList = new List<AdvisorCategoryAvailabilityDTO>();
            foreach (var catId in categoryIds)
            {
                var availability = await _availabilityService.GetAdvisorAvailabilityAsync(advisorProfile.Id, catId);
                availability.IsSelected = selectedCategoryIds.Contains(catId);
                availabilityList.Add(availability);
            }

            return availabilityList.OrderBy(a => a.CategoryName).ToList();
        }

        /// <inheritdoc />
        public async Task<(bool Success, string Message)> UpdateMyAvailabilityAsync(int userId, List<int> selectedCategoryIds)
        {
            var advisorProfile = await _context.AdvisorProfiles
                .FirstOrDefaultAsync(ap => ap.UserId == userId);

            if (advisorProfile == null)
                return (false, "Advisor profile not found for the current user.");

            var sanitized = selectedCategoryIds
                .Distinct()
                .Where(x => x > 0)
                .ToList();

            var existingCategoryIds = await _context.ProjectCategories
                .AsNoTracking()
                .Where(c => sanitized.Contains(c.Id))
                .Select(c => c.Id)
                .ToListAsync();

            if (sanitized.Count != existingCategoryIds.Count)
                return (false, "One or more selected categories do not exist.");

            var currentRows = await _context.AdvisorCategoryPreferences
                .Where(x => x.AdvisorId == advisorProfile.Id)
                .ToListAsync();

            _context.AdvisorCategoryPreferences.RemoveRange(currentRows);

            var newRows = existingCategoryIds.Select(categoryId => new AdvisorCategoryPreference
            {
                AdvisorId = advisorProfile.Id,
                CategoryId = categoryId
            });
            await _context.AdvisorCategoryPreferences.AddRangeAsync(newRows);
            await _context.SaveChangesAsync();

            return (true, "Advisor availability categories updated.");
        }

        /// <inheritdoc />
        public async Task<List<AdvisorCategoryListItemDTO>> GetSearchCategoriesAsync()
        {
            return await _context.ProjectCategories
                .AsNoTracking()
                .Select(c => new AdvisorCategoryListItemDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    AdvisorRequired = c.AdvisorRequired,
                    ProjectCount = _context.Projects.Count(p => p.CategoryId == c.Id)
                })
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
    }
}
