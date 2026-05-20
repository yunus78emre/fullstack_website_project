using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth
{
    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Reset token is required.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Token must be exactly 6 digits.")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required.")]
        [RegularExpression(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$",
            ErrorMessage = "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
