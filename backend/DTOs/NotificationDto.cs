using System;

namespace backend.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool Read { get; set; }
        public string Kind { get; set; } = string.Empty;
        public string? ProjectCategory { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
