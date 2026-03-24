using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("student_requests")]
    public class StudentRequest
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("project_id")]
        public int ProjectId { get; set; }

        [Required]
        [Column("applicant_student_id")]
        public int ApplicantStudentId { get; set; }

        [Column("message")]
        public string? Message { get; set; }

        [Column("status")]
        public RequestStatus Status { get; set; } = RequestStatus.PENDING;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        [ForeignKey("ApplicantStudentId")]
        public virtual StudentProfile? ApplicantStudent { get; set; }
    }
}
