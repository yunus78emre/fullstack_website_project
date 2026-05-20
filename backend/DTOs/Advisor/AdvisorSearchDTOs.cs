using System;
using System.Collections.Generic;
using backend.Models;

namespace backend.DTOs.Advisor
{
    // ── Project Search Query ───────────────────────────────────────────────────

    public class AdvisorSearchProjectsQueryDTO
    {
        // Free text search (Title, Description, Category, Owner)
        public string? Q { get; set; }

        // Category Filters
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }

        // Status Filter
        public string? Status { get; set; }

        // Advisor Logic Filters
        public bool? AdvisorRequired { get; set; }
        public bool? HasAssignedAdvisor { get; set; }
        public bool? OnlyWithoutAdvisor { get; set; }

        // Team Size Filters
        public int? MinTeamSize { get; set; }
        public int? MaxTeamSize { get; set; }

        // Owner/Metadata Filters
        public string? OwnerDepartment { get; set; }
        public DateOnly? EventDateFrom { get; set; }
        public DateOnly? EventDateTo { get; set; }

        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        // Sorting
        public string SortBy { get; set; } = "created_at"; // created_at, title, status, category_name, owner_name
        public string SortOrder { get; set; } = "desc"; // asc, desc
    }

    // ── Project Search Response ────────────────────────────────────────────────

    public class AdvisorSearchProjectsResponseDTO
    {
        public List<AdvisorSearchProjectItemDTO> Items { get; set; } = new();
        public AdvisorSearchPaginationDTO Pagination { get; set; } = null!;
    }

    public class AdvisorSearchProjectItemDTO
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TeamSize { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CurrentMemberCount { get; set; }

        // Business flags for the advisor
        public bool IsRequestable { get; set; }
        public bool AlreadyRequested { get; set; }
        public bool AlreadyAssigned { get; set; }
        public AdvisorCategoryAvailabilityDTO? CategoryAvailability { get; set; }

        public AdvisorSearchProjectCategoryDTO? Category { get; set; }
        public AdvisorSearchProjectOwnerDTO Owner { get; set; } = null!;
        public AdvisorSearchProjectAdvisorDTO? Advisor { get; set; }
        public List<AdvisorSearchProjectSkillDTO> Skills { get; set; } = new();
    }

    public class AdvisorSearchProjectCategoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? DefaultTeamSize { get; set; }
        public decimal? DefaultBudget { get; set; }
        public bool AdvisorRequired { get; set; }
        public DateOnly? EventDate { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class AdvisorSearchProjectOwnerDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int? Year { get; set; }
    }

    public class AdvisorSearchProjectAdvisorDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class AdvisorSearchProjectSkillDTO
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
    }

    // ── Pagination Metadata ────────────────────────────────────────────────────

    public class AdvisorSearchPaginationDTO
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    // ── Category List (Optional but Useful) ────────────────────────────────────

    public class AdvisorCategoryListItemDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool AdvisorRequired { get; set; }
        public int ProjectCount { get; set; }
    }
}
