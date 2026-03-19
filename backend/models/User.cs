using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("role_id")]
        public int RoleId { get; set; }

        [Required]
        [Column("full_name")]
        [StringLength(120)]
        public string FullName { get; set; }

        [Required]
        [Column("email")]
        [StringLength(120)]
        public string Email { get; set; }

        [Required]
        [Column("password_hash")]
        public string PasswordHash { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        
        [ForeignKey("RoleId")]
        public virtual Role? Role { get; set; }
    }
}