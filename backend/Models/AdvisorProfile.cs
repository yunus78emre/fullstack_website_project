using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("advisor_profiles")]
    public class AdvisorProfile
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

        [Column("academic_title")]
        [StringLength(100)]
        public string? AcademicTitle { get; set; }

        [Column("expertise")]
        public string? Expertise { get; set; }

        [Column("research_interests")]
        public string? ResearchInterests { get; set; }

        [Column("available_for_advising")]
        public bool AvailableForAdvising { get; set; } = true;

        // Navigation Property
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
