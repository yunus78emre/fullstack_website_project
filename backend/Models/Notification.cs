using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        public User? User { get; set; }

        [Column("title")]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Column("body")]
        public string Body { get; set; } = string.Empty;

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// project | system | announcement
        /// </summary>
        [Column("kind")]
        [MaxLength(50)]
        public string Kind { get; set; } = "system";

        /// <summary>
        /// Used by the frontend to colorize the notification based on a project category
        /// </summary>
        [Column("project_category")]
        [MaxLength(100)]
        public string? ProjectCategory { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
