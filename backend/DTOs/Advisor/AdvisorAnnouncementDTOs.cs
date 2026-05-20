using System;
using System.Collections.Generic;

namespace backend.DTOs.Advisor
{
    // ── Feed Response Wrapper ──────────────────────────────────────────────────

    public class AdvisorAnnouncementsFeedResponseDTO
    {
        public List<AdvisorAnnouncementFeedItemDTO> Items { get; set; } = new();
    }

    // ── Unified Feed Item ──────────────────────────────────────────────────────

    public class AdvisorAnnouncementFeedItemDTO
    {
        /// <summary>
        /// Possible values: DirectAnnouncement, CategoryAnnouncement, ProjectLookingForAdvisorAnnouncement
        /// </summary>
        public string AnnouncementType { get; set; } = string.Empty;

        public int ItemId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? Summary { get; set; }

        // ── Details (One of these will be populated depending on Type) ─────────

        public AdvisorDirectAnnouncementDetailDTO? DirectDetail { get; set; }
        public AdvisorCategoryAnnouncementDetailDTO? CategoryDetail { get; set; }
        public AdvisorProjectOpportunityDetailDTO? ProjectDetail { get; set; }
    }

    // ── Type-Specific Details ──────────────────────────────────────────────────

    public class AdvisorDirectAnnouncementDetailDTO
    {
        public int? PublisherUserId { get; set; }
        public string? PublisherFullName { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
    }

    public class AdvisorCategoryAnnouncementDetailDTO
    {
        public int CategoryId { get; set; }
        public int? DefaultTeamSize { get; set; }
        public decimal? DefaultBudget { get; set; }
        public bool AdvisorRequired { get; set; }
        public DateOnly? EventDate { get; set; }
    }

    public class AdvisorProjectOpportunityDetailDTO
    {
        public int ProjectId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? TeamSize { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CurrentMemberCount { get; set; }
        public bool AlreadyRequested { get; set; }
        public AdvisorCategoryAvailabilityDTO? CategoryAvailability { get; set; }

        public AdvisorAnnouncementCategoryDTO? Category { get; set; }
        public AdvisorAnnouncementOwnerStudentDTO Owner { get; set; } = null!;
        public List<AdvisorAnnouncementSkillDTO> Skills { get; set; } = new();
    }

    // ── Shared Sub-DTOs ────────────────────────────────────────────────────────

    public class AdvisorAnnouncementCategoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool AdvisorRequired { get; set; }
        public DateOnly? EventDate { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class AdvisorAnnouncementOwnerStudentDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int? Year { get; set; }
    }

    public class AdvisorAnnouncementSkillDTO
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
    }
}
