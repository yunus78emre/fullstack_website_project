using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("project_categories")]
    public class ProjectCategory
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("name")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("default_team_size")]
        public int? DefaultTeamSize { get; set; }

        [Column("default_budget")]
        public decimal? DefaultBudget { get; set; }

        [Column("advisor_required")]
        public bool AdvisorRequired { get; set; } = false;

        [Column("event_date")]
        public DateOnly? EventDate { get; set; }
    }
}
