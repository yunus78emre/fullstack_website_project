using System;
using System.Collections.Generic;

namespace backend.DTOs.Student
{
    public class StudentProjectListItemDTO
    {
        // A) Project basic info
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TeamSize { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // B) Category info
        public StudentProjectCategoryDTO? Category { get; set; }

        // C) Owner student info
        public StudentProjectOwnerDTO Owner { get; set; } = null!;

        // D) Advisor info
        public StudentProjectAdvisorDTO? Advisor { get; set; }

        // E) Project members
        public List<StudentProjectMemberDTO> Members { get; set; } = new();

        // F) Optional info
        public List<StudentProjectSkillDTO> Skills { get; set; } = new();
        public int TotalMemberCount { get; set; }
    }

    public class StudentProjectCategoryDTO
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

    public class StudentProjectOwnerDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int? Year { get; set; }
    }

    public class StudentProjectAdvisorDTO
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

    public class StudentProjectMemberDTO
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

    public class StudentProjectSkillDTO
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
    }
}
