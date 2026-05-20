using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Admin
{
    // ──────────────────────────────────────────────────────────────
    // Request DTOs – used to receive data from the client
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// DTO for creating a new announcement.
    /// </summary>
    public class AnnouncementCreateDto
    {
        [Required(ErrorMessage = "Announcement title is required.")]
        [StringLength(200, ErrorMessage = "Announcement title cannot exceed 200 characters.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Announcement description/content is required.")]
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Optional category association for the announcement.
        /// </summary>
        public int? CategoryId { get; set; }
    }

    /// <summary>
    /// DTO for updating an existing announcement.
    /// </summary>
    public class AnnouncementUpdateDto
    {
        [Required(ErrorMessage = "Announcement title is required.")]
        [StringLength(200, ErrorMessage = "Announcement title cannot exceed 200 characters.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Announcement description/content is required.")]
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Optional category association for the announcement.
        /// </summary>
        public int? CategoryId { get; set; }
    }

    // ──────────────────────────────────────────────────────────────
    // Response DTOs – used to send data back to the client
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// DTO returned after an announcement is created, updated, or retrieved.
    /// </summary>
    public class AnnouncementResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// The admin who published the announcement.
        /// </summary>
        public AnnouncementPublisherDto? Publisher { get; set; }

        /// <summary>
        /// The category linked to the announcement, if any.
        /// </summary>
        public AnnouncementCategoryDto? Category { get; set; }
    }

    /// <summary>
    /// Nested DTO representing the publisher (admin) of an announcement.
    /// </summary>
    public class AnnouncementPublisherDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Nested DTO representing the category attached to an announcement.
    /// </summary>
    public class AnnouncementCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }
}
