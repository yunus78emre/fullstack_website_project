using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("advisor_category_preferences")]
    public class AdvisorCategoryPreference
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("advisor_id")]
        public int AdvisorId { get; set; }

        [Required]
        [Column("category_id")]
        public int CategoryId { get; set; }

        [ForeignKey("AdvisorId")]
        public virtual AdvisorProfile? Advisor { get; set; }

        [ForeignKey("CategoryId")]
        public virtual ProjectCategory? Category { get; set; }
    }
}
