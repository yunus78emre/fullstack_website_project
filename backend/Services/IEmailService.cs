namespace backend.Services
{
    /// <summary>
    /// Defines contract for sending transactional emails.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Sends a password reset code to the specified recipient's email address.
        /// </summary>
        Task SendPasswordResetEmailAsync(string recipientEmail, string recipientName, string resetToken);
    }
}
