using System;
using System.Collections.Generic;

namespace backend.DTOs.Student
{
    public class StudentIncomingRequestItemDTO
    {
        public string RequestType { get; set; } = string.Empty; // "StudentRequest" or "AdvisorRequest"
        public int RequestId { get; set; }
        
        public StudentIncomingRequestProjectDTO Project { get; set; } = null!;
        
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public StudentIncomingRequestStudentSenderDTO? SenderStudent { get; set; }
        public StudentIncomingRequestStudentSenderDTO? RecipientStudent { get; set; }
        public StudentIncomingRequestAdvisorSenderDTO? AdvisorSender { get; set; }
    }

    public class StudentIncomingRequestProjectDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Status { get; set; }
        public int? TeamSize { get; set; }
        public StudentIncomingRequestCategoryDTO Category { get; set; } = null!;
    }

    public class StudentIncomingRequestCategoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }

    public class StudentIncomingRequestStudentSenderDTO
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
        public List<string> Skills { get; set; } = new();
    }

    public class StudentIncomingRequestAdvisorSenderDTO
    {
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? AcademicTitle { get; set; }
        public string? Expertise { get; set; }
        public string? ResearchInterests { get; set; }
    }
}
