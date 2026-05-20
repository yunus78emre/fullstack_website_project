using System.Collections.Generic;
using backend.DTOs.Advisor;

namespace backend.DTOs.Student
{
    public abstract class StudentSearchPaginationQueryDTO
    {
        public string? Q { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; }
        public string? SortOrder { get; set; } = "asc";
    }

    public class StudentSearchPaginationResponseDTO<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    // ================= ADVISOR ================= //

    public class StudentSearchAdvisorsQueryDTO : StudentSearchPaginationQueryDTO
    {
        public string? Department { get; set; }
        public bool? AvailableForAdvising { get; set; }
        public string? AcademicTitle { get; set; }
        public int? ProjectId { get; set; }
    }

    public class StudentSearchAdvisorItemDTO
    {
        public int AdvisorProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? AcademicTitle { get; set; }
        public string? Expertise { get; set; }
        public string? ResearchInterests { get; set; }
        public bool AvailableForAdvising { get; set; }
        public AdvisorCategoryAvailabilityDTO? CategoryAvailability { get; set; }
    }

    // ================= STUDENT ================= //

    public class StudentSearchStudentsQueryDTO : StudentSearchPaginationQueryDTO
    {
        public string? Department { get; set; }
        public int? Year { get; set; }
        public string? Interest { get; set; }
        public int? ProjectId { get; set; }
    }

    public class StudentSearchStudentItemDTO
    {
        public int StudentProfileId { get; set; }
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

    // ================= PROJECT ================= //

    public class StudentSearchProjectsQueryDTO : StudentSearchPaginationQueryDTO
    {
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? Status { get; set; }
        public bool? AdvisorRequired { get; set; }
        public int? MinTeamSize { get; set; }
        public int? MaxTeamSize { get; set; }
    }

    public class StudentSearchProjectItemDTO
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TeamSize { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CurrentMemberCount { get; set; } 
        public bool AlreadyRequested { get; set; }

        public StudentSearchProjectCategoryDTO Category { get; set; } = null!;
        public StudentSearchProjectOwnerDTO Owner { get; set; } = null!;
        public StudentSearchProjectAdvisorDTO? Advisor { get; set; }
    }

    public class StudentSearchProjectCategoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool AdvisorRequired { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class StudentSearchProjectOwnerDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Department { get; set; }
    }

    public class StudentSearchProjectAdvisorDTO
    {
        public int ProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
    }
}
