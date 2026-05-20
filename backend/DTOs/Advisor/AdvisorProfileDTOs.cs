using System;
using System.Collections.Generic;

namespace backend.DTOs.Advisor
{
    /// <summary>
    /// Top-level response DTO returned by GET /api/advisor/profile/me.
    /// Combines user-level info with advisor-specific profile details.
    /// </summary>
    public class AdvisorProfileResponseDTO
    {
        /// <summary>User account information.</summary>
        public AdvisorProfileUserInfoDTO User { get; set; } = null!;

        /// <summary>Advisor-specific profile details.</summary>
        public AdvisorProfileDetailsDTO Profile { get; set; } = null!;
    }

    /// <summary>
    /// Contains data sourced from the `users` table.
    /// </summary>
    public class AdvisorProfileUserInfoDTO
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }

    /// <summary>
    /// Contains data sourced from the `advisor_profiles` table.
    /// </summary>
    public class AdvisorProfileDetailsDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Department { get; set; }
        public string? AcademicTitle { get; set; }
        public string? Expertise { get; set; }
        public string? ResearchInterests { get; set; }
        public bool AvailableForAdvising { get; set; }
        public List<string> Skills { get; set; } = new();
    }
}
