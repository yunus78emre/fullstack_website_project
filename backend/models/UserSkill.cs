using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("user_skills")]
    public class UserSkill
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("skill_id")]
        public int SkillId { get; set; }

        [Column("level")]
        [StringLength(50)]
        public string? Level { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("SkillId")]
        public virtual Skill? Skill { get; set; }
    }
}
