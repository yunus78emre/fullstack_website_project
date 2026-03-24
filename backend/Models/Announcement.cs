using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("announcements")]
    public class Announcement
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("category_id")]
        public int? CategoryId { get; set; }

        [Column("published_by")]
        public int? PublishedBy { get; set; }

        [Column("title")]
        [StringLength(200)]
        public string? Title { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("CategoryId")]
        public virtual ProjectCategory? Category { get; set; }

        [ForeignKey("PublishedBy")]
        public virtual User? Publisher { get; set; }
    }
}
