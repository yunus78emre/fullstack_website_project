using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task SendPasswordResetEmailAsync(
            string recipientEmail,
            string recipientName,
            string resetToken)
        {
            try
            {
                var settings = _configuration.GetSection("EmailSettings");

                var senderEmail = settings["SenderEmail"];

                // HER DURUMDA KODU TERMINALE YAZDIR (Mail ulasmazsa diye yedek plan)
                _logger.LogWarning("====== DIKKAT! SIFRE SIFIRLAMA KODU: {Token} (Kullanici: {Email}) ======", resetToken, recipientEmail);

                if (string.IsNullOrEmpty(senderEmail) || senderEmail == "__SET_VIA_USER_SECRETS_OR_ENV__")
                {
                    _logger.LogWarning("Email settings are not configured. Bypassing email sending.");
                    return;
                }

                // Build the email message
                var message = new MimeMessage();

                // Display name is always "SE302 Project Support Team" regardless of the real sender address
                message.From.Add(new MailboxAddress("SE302 Project Support Team", senderEmail));
                message.To.Add(new MailboxAddress(recipientName, recipientEmail));
                message.Subject = "Password Reset Code — SE302 Project Management System";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody  = BuildHtmlBody(recipientName, resetToken),
                    TextBody  = $"Your password reset code: {resetToken}\nThis code is valid for 15 minutes."
                };
                message.Body = bodyBuilder.ToMessageBody();

                // Send via SMTP
                using var client = new SmtpClient();

                await client.ConnectAsync(
                    settings["SmtpHost"],
                    int.Parse(settings["SmtpPort"] ?? "587"),
                    SecureSocketOptions.StartTls
                );

                await client.AuthenticateAsync(settings["Username"], settings["Password"]);
                await client.SendAsync(message);
                await client.DisconnectAsync(quit: true);

                _logger.LogInformation("Password reset email sent successfully to {Email}", recipientEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", recipientEmail);
                throw; // Re-throw so the controller can handle it
            }
        }

        // ─── Private Helpers ────────────────────────────────────────────────────

        private static string BuildHtmlBody(string name, string token)
        {
            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
</head>
<body style=""margin:0;padding:0;background-color:#0d0d1a;font-family:Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#0d0d1a;padding:40px 0;"">
    <tr>
      <td align=""center"">
        <table width=""580"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#1a1a2e;border-radius:12px;overflow:hidden;"">

          <!-- Header -->
          <tr>
            <td style=""background:linear-gradient(135deg,#e94560,#9b1d44);padding:30px;text-align:center;"">
              <h1 style=""margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;"">
                SE302 Project Management System
              </h1>
              <p style=""margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;"">
                SE302 Proje Destek Ekibi
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style=""padding:36px 40px;"">
              <p style=""margin:0 0 16px;color:#cccccc;font-size:15px;"">
                Hello <strong style=""color:#ffffff;"">{name}</strong>,
              </p>
              <p style=""margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.6;"">
                We received a request to reset the password for your account.
                Use the code below to complete the process.
              </p>

              <!-- Reset Code Box -->
              <div style=""text-align:center;margin:28px 0;"">
                <div style=""display:inline-block;background-color:#0f3460;border:2px solid #e94560;border-radius:10px;padding:18px 36px;"">
                  <span style=""font-size:42px;font-weight:bold;color:#e94560;letter-spacing:14px;"">{token}</span>
                </div>
              </div>

              <p style=""margin:0 0 8px;color:#aaaaaa;font-size:13px;text-align:center;"">
                ⏱ This code is valid for <strong style=""color:#ffffff;"">15 minutes</strong>.
              </p>
              <p style=""margin:0;color:#666666;font-size:12px;text-align:center;"">
                If you did not request a password reset, please ignore this email.
                Your password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""background-color:#111122;padding:20px;text-align:center;"">
              <p style=""margin:0;color:#555555;font-size:11px;"">
                This is an automated message from SE302 Project Support Team.<br/>
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
        }
    }
}
