using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("project_skills")]
    public class ProjectSkill
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("project_id")]
        public int? ProjectId { get; set; }

        [Column("skill_id")]
        public int? SkillId { get; set; }

        // Navigation Properties
        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        [ForeignKey("SkillId")]
        public virtual Skill? Skill { get; set; }
    }
}
