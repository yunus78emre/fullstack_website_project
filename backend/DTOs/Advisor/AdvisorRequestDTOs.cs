using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Advisor
{
    // ── Request DTO ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Request body for POST /api/advisor/requests/send.
    /// The advisor ID is inferred from the JWT token — only project and message are needed.
    /// </summary>
    public class AdvisorSendRequestRequestDTO
    {
        [Required(ErrorMessage = "Project ID is required.")]
        public int ProjectId { get; set; }

        [StringLength(1000, ErrorMessage = "Message cannot exceed 1000 characters.")]
        public string? Message { get; set; }
    }

    // ── Response DTOs ────────────────────────────────────────────────────────────

    /// <summary>
    /// Top-level response returned after successfully creating an advisor request.
    /// </summary>
    public class AdvisorSendRequestResponseDTO
    {
        public int AdvisorRequestId { get; set; }
        public string? Message { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public AdvisorSendRequestProjectDTO Project { get; set; } = null!;
        public AdvisorSendRequestOwnerStudentDTO OwnerStudent { get; set; } = null!;
        public AdvisorSendRequestAdvisorDTO Advisor { get; set; } = null!;
    }

    /// <summary>
    /// Project info included in the send-request response.
    /// </summary>
    public class AdvisorSendRequestProjectDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public AdvisorSendRequestCategoryDTO? Category { get; set; }
    }

    /// <summary>
    /// Category info nested inside the project response.
    /// </summary>
    public class AdvisorSendRequestCategoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }

    /// <summary>
    /// Owner student info included in the send-request response.
    /// </summary>
    public class AdvisorSendRequestOwnerStudentDTO
    {
        public int ProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Advisor info included in the send-request response.
    /// </summary>
    public class AdvisorSendRequestAdvisorDTO
    {
        public int ProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Department { get; set; }
    }
}
