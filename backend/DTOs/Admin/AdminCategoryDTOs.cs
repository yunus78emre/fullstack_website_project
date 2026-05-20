using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Admin
{
    // ──────────────────────────────────────────────────────────────
    // Request DTOs – used to receive data from the client
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// DTO for creating a new project category.
    /// </summary>
    public class CategoryCreateDto
    {
        [Required(ErrorMessage = "Category name is required.")]
        [StringLength(100, ErrorMessage = "Category name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category description is required.")]
        public string Description { get; set; } = string.Empty;

        public int? DefaultTeamSize { get; set; }

        public decimal? DefaultBudget { get; set; }

        public bool AdvisorRequired { get; set; } = false;

        public int? MaxProjectsPerAdvisor { get; set; }

        [Required(ErrorMessage = "Event date is required.")]
        public DateOnly? EventDate { get; set; }

        [Required(ErrorMessage = "Category color is required.")]
        [RegularExpression(@"^#[0-9a-fA-F]{6}$", ErrorMessage = "Color must be a hex code in the format #RRGGBB.")]
        public string Color { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for updating an existing project category.
    /// </summary>
    public class CategoryUpdateDto
    {
        [Required(ErrorMessage = "Category name is required.")]
        [StringLength(100, ErrorMessage = "Category name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category description is required.")]
        public string Description { get; set; } = string.Empty;

        public int? DefaultTeamSize { get; set; }

        public decimal? DefaultBudget { get; set; }

        public bool AdvisorRequired { get; set; } = false;

        public int? MaxProjectsPerAdvisor { get; set; }

        [Required(ErrorMessage = "Event date is required.")]
        public DateOnly? EventDate { get; set; }

        [Required(ErrorMessage = "Category color is required.")]
        [RegularExpression(@"^#[0-9a-fA-F]{6}$", ErrorMessage = "Color must be a hex code in the format #RRGGBB.")]
        public string Color { get; set; } = string.Empty;
    }

    // ──────────────────────────────────────────────────────────────
    // Response DTOs – used to send data back to the client
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// DTO returned after a category is created, updated, or retrieved.
    /// </summary>
    public class CategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? DefaultTeamSize { get; set; }
        public decimal? DefaultBudget { get; set; }
        public bool AdvisorRequired { get; set; }
        public int? MaxProjectsPerAdvisor { get; set; }
        public DateOnly? EventDate { get; set; }
        public string Color { get; set; } = string.Empty;
    }
}
