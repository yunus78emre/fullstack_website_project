using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("projects")]
    public class Project
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("title")]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("team_size")]
        public int? TeamSize { get; set; }

        [Column("status")]
        public ProjectStatus Status { get; set; } = ProjectStatus.OPEN;

        [Column("category_id")]
        public int? CategoryId { get; set; }

        [Required]
        [Column("owner_student_id")]
        public int OwnerStudentId { get; set; }

        [Column("advisor_assigned_id")]
        public int? AdvisorAssignedId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("CategoryId")]
        public virtual ProjectCategory? Category { get; set; }

        [ForeignKey("OwnerStudentId")]
        public virtual StudentProfile? OwnerStudent { get; set; }

        [ForeignKey("AdvisorAssignedId")]
        public virtual AdvisorProfile? AdvisorAssigned { get; set; }
    }
}
