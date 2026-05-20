using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Student
{
    public class StudentSendAdvisorRequestRequestDTO
    {
        [Required(ErrorMessage = "Project ID is required.")]
        public int ProjectId { get; set; }

        [Required(ErrorMessage = "Advisor ID is required.")]
        public int AdvisorId { get; set; }

        [StringLength(1000, ErrorMessage = "Message cannot exceed 1000 characters.")]
        public string? Message { get; set; }
    }

    public class StudentSendAdvisorRequestResponseDTO
    {
        public int AdvisorRequestId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public StudentSendAdvisorRequestProjectDTO Project { get; set; } = null!;
        public StudentSendAdvisorRequestAdvisorDTO Advisor { get; set; } = null!;
    }

    public class StudentSendAdvisorRequestProjectDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
    }

    public class StudentSendAdvisorRequestAdvisorDTO
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
    }
}
