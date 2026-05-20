using System;
using System.Collections.Generic;

namespace backend.DTOs.Advisor
{
    /// <summary>
    /// Response wrapper for the incoming requests list.
    /// </summary>
    public class AdvisorIncomingRequestsResponseDTO
    {
        public List<AdvisorIncomingRequestItemDTO> Requests { get; set; } = new();
    }

    /// <summary>
    /// Represents a single incoming request item for an advisor.
    /// </summary>
    public class AdvisorIncomingRequestItemDTO
    {
        // ── Request Info ──
        public int AdvisorRequestId { get; set; }
        public string? Message { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        // ── Project Info ──
        public AdvisorIncomingRequestProjectDTO Project { get; set; } = null!;

        // ── Sender Student Info (Project Owner) ──
        public AdvisorIncomingRequestOwnerStudentDTO SenderStudent { get; set; } = null!;

        // ── Current Advisor Info ──
        public AdvisorIncomingRequestAdvisorDTO Advisor { get; set; } = null!;
    }

    /// <summary>
    /// Project details for the incoming request.
    /// </summary>
    public class AdvisorIncomingRequestProjectDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TeamSize { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? AssignedAdvisorId { get; set; }
        public bool HasAssignedAdvisor { get; set; }
        public int TotalMemberCount { get; set; }

        public AdvisorIncomingRequestCategoryDTO? Category { get; set; }
        public List<AdvisorIncomingRequestSkillDTO> Skills { get; set; } = new();
    }

    /// <summary>
    /// Category details for the project.
    /// </summary>
    public class AdvisorIncomingRequestCategoryDTO
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
    /// Info of the student who sent the request (project owner).
    /// </summary>
    public class AdvisorIncomingRequestOwnerStudentDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int? Year { get; set; }
        public string? Interests { get; set; }
        public string? Bio { get; set; }
        public string? GithubLink { get; set; }
        public string? LinkedinLink { get; set; }
    }

    /// <summary>
    /// Target advisor info for clarity.
    /// </summary>
    public class AdvisorIncomingRequestAdvisorDTO
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
    /// Skill info for the project.
    /// </summary>
    public class AdvisorIncomingRequestSkillDTO
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
    }
}
