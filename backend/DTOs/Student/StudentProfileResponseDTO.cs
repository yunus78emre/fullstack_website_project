using System;
using System.Collections.Generic;

namespace backend.DTOs.Student
{
    public class StudentProfileResponseDTO
    {
        // User Info
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string RoleName { get; set; } = string.Empty;

        // Student Profile Info
        public int ProfileId { get; set; }
        public int UserId { get; set; }
        public string? Department { get; set; }
        public int? Year { get; set; }
        public string? Interests { get; set; }
        public string? Bio { get; set; }
        public string? GithubLink { get; set; }
        public string? LinkedinLink { get; set; }
        public List<string> Skills { get; set; } = new();
    }
}
