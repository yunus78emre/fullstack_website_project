using System;
using System.Collections.Generic;

namespace backend.DTOs.Student
{
    public class StudentAnnouncementsFeedResponseDTO
    {
        public List<StudentAnnouncementFeedItemDTO> Items { get; set; } = new();
    }

    public class StudentAnnouncementFeedItemDTO
    {
        public string AnnouncementType { get; set; } = string.Empty;
        public int ItemId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }

        // Specific sub-types
        public StudentAnnouncementPublisherDTO? Publisher { get; set; }
        public StudentAnnouncementCategoryDTO? Category { get; set; }
        public StudentAnnouncementAdvisorDTO? Advisor { get; set; }
        public StudentAnnouncementProjectDTO? Project { get; set; }
    }

    public class StudentAnnouncementPublisherDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
    }

    public class StudentAnnouncementCategoryDTO
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

    public class StudentAnnouncementAdvisorDTO
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

    public class StudentAnnouncementProjectDTO
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? TeamSize { get; set; }
        
        public int OwnerProfileId { get; set; }
        public int OwnerUserId { get; set; }
        public string OwnerFullName { get; set; } = string.Empty;
        public string OwnerEmail { get; set; } = string.Empty;
    }
}
