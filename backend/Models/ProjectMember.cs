using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("project_members")]
    public class ProjectMember
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("project_id")]
        public int ProjectId { get; set; }

        [Required]
        [Column("student_id")]
        public int StudentId { get; set; }

        [Required]
        [Column("member_role")]
        [StringLength(120)]
        public string MemberRole { get; set; } = string.Empty;

        // Navigation Properties
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        [ForeignKey("StudentId")]
        public virtual StudentProfile? Student { get; set; }
    }
}
