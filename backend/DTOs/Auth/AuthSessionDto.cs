namespace backend.DTOs.Auth
{
    /// <summary>
    /// Current user display fields for client session refresh (UTF-8 from DB).
    /// </summary>
    public class AuthSessionDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
