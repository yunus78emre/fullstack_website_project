using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("skills")]
    public class Skill
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("skill_name")]
        [StringLength(120)]
        public string SkillName { get; set; } = string.Empty;
    }
}
