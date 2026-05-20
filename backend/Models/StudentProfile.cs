using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("student_profiles")]
    public class StudentProfile
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("department")]
        [StringLength(120)]
        public string? Department { get; set; }

        [Column("year")]
        public int? Year { get; set; }

        [Column("interests")]
        public string? Interests { get; set; }

        [Column("bio")]
        public string? Bio { get; set; }

        [Column("github_link")]
        [StringLength(200)]
        public string? GithubLink { get; set; }

        [Column("linkedin_link")]
        [StringLength(200)]
        public string? LinkedinLink { get; set; }

        // Navigation Property
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
