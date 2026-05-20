using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Student
{
    public class StudentCreateProjectRequestDTO
    {
        [Required(ErrorMessage = "Project title is required.")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(1, 100, ErrorMessage = "Team size must be between 1 and 100.")]
        public int? TeamSize { get; set; }

        [Required(ErrorMessage = "Category selection is required.")]
        public int CategoryId { get; set; }
    }

    public class StudentCreateProjectResponseDTO
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TeamSize { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public StudentCreateProjectCategoryDTO Category { get; set; } = null!;
        public StudentCreateProjectOwnerDTO Owner { get; set; } = null!;
    }

    public class StudentCreateProjectCategoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }

    public class StudentCreateProjectOwnerDTO
    {
        public int ProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
