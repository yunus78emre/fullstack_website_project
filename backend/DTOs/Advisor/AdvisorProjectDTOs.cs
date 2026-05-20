using System;
using System.Collections.Generic;

namespace backend.DTOs.Advisor
{
    /// <summary>
    /// Represents a single project in the advisor's involved-projects list.
    /// </summary>
    public class AdvisorProjectListItemDTO
    {
        // ── Project Basic Info ──
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TeamSize { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // ── Related Data ──
        public AdvisorProjectCategoryDTO? Category { get; set; }
        public AdvisorProjectOwnerDTO Owner { get; set; } = null!;
        public AdvisorProjectAdvisorDTO Advisor { get; set; } = null!;
        public List<AdvisorProjectMemberDTO> Members { get; set; } = new();
        public List<AdvisorProjectSkillDTO> Skills { get; set; } = new();

        // ── Computed ──
        public int TotalMemberCount { get; set; }
    }

    /// <summary>
    /// Category details for the project (e.g. TUBITAK, TEKNOFEST).
    /// </summary>
    public class AdvisorProjectCategoryDTO
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

    /// <summary>
    /// Owner student info for the project.
    /// </summary>
    public class AdvisorProjectOwnerDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int? Year { get; set; }
    }

    /// <summary>
    /// Assigned advisor info for the project.
    /// </summary>
    public class AdvisorProjectAdvisorDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? AcademicTitle { get; set; }
        public string? Expertise { get; set; }
        public string? ResearchInterests { get; set; }
        public bool AvailableForAdvising { get; set; }
    }

    /// <summary>
    /// A single project member entry.
    /// </summary>
    public class AdvisorProjectMemberDTO
    {
        public int ProjectMemberId { get; set; }
        public int StudentProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int? Year { get; set; }
        public string MemberRole { get; set; } = string.Empty;
    }

    /// <summary>
    /// A skill tag associated with the project.
    /// </summary>
    public class AdvisorProjectSkillDTO
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
    }
}
