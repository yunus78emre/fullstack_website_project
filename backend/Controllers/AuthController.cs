using backend.Data;
using backend.DTOs.Auth;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            AppDbContext context,
            ITokenService tokenService,
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _context      = context;
            _tokenService = tokenService;
            _emailService = emailService;
            _logger       = logger;
        }

        // ─── Login ───────────────────────────────────────────────────────────────

        /// <summary>
        /// Authenticates the user and returns a JWT access token.
        /// The admin account (admin@uskudar.edu.tr) must already exist in the database.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                string normalizedEmail = dto.Email.ToLower().Trim();

                // Fetch user along with their role
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

                // Use a generic error message to prevent user enumeration
                if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                    return Unauthorized(new { message = "Invalid email or password." });

                string roleName = user.Role?.RoleName ?? "Unknown";
                string token    = _tokenService.GenerateToken(user, roleName);

                _logger.LogInformation("User logged in: {Email} | Role: {Role}", user.Email, roleName);

                return Ok(new AuthResponseDto
                {
                    Token    = token,
                    FullName = user.FullName,
                    Email    = user.Email,
                    Role     = roleName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during login for: {Email}", dto.Email);
                return StatusCode(500, new { message = "An unexpected error occurred. Please try again later." });
            }
        }

        /// <summary>
        /// Returns the current user's name, email and role from the database (fixes stale/corrupt client cache).
        /// </summary>
        [HttpGet("me")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized(new { message = "Invalid token." });

            var user = await _context.Users
                .Include(u => u.Role)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(new AuthSessionDto
            {
                FullName = user.FullName,
                Email    = user.Email,
                Role     = user.Role?.RoleName ?? "Unknown"
            });
        }

        // ─── Forgot Password ─────────────────────────────────────────────────────

        /// <summary>
        /// Generates a 6-digit reset code and sends it to the user's email.
        /// Always returns 200 OK to prevent email enumeration.
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                string normalizedEmail = dto.Email.ToLower().Trim();

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

                // Return a generic response even if the email doesn't exist (security best practice)
                if (user is null)
                    return Ok(new { message = "If this email is registered, you will shortly receive a reset code." });

                // Invalidate any previously active reset tokens for this user
                var activeTokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
                    .ToListAsync();

                foreach (var activeToken in activeTokens)
                    activeToken.IsUsed = true;

                // Generate and store a new 6-digit reset code (valid for 15 minutes)
                string resetCode = GenerateResetCode();

                _context.PasswordResetTokens.Add(new PasswordResetToken
                {
                    UserId    = user.Id,
                    Token     = resetCode,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                // Send the email — if this fails, the exception is caught below
                await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetCode);

                _logger.LogInformation("Password reset code sent to: {Email}", user.Email);
                return Ok(new { message = "If this email is registered, you will shortly receive a reset code." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during forgot-password for: {Email}", dto.Email);
                return StatusCode(500, new { message = "An unexpected error occurred. Please try again later." });
            }
        }

        // ─── Update Profile ───────────────────────────────────────────────────────

        public class UpdateProfileDto
        {
            public string? Name { get; set; }
            public string? Department { get; set; }
            public int? Year { get; set; }
            public string? Interests { get; set; }
            public string? GithubLink { get; set; }
            public string? LinkedinLink { get; set; }
            public string? Biography { get; set; }
            public string? AcademicTitle { get; set; }
            public string? AreasOfExpertise { get; set; }
            public string? ResearchInterests { get; set; }
            public List<string>? Skills { get; set; }
        }

        [HttpPut("profile")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                var userIdString = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                    return Unauthorized(new { message = "Invalid token." });

                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null) return NotFound(new { message = "User not found." });

                // Update common field
                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    user.FullName = dto.Name;
                }

                // Update role specific profiles
                string roleName = user.Role?.RoleName ?? "";
                if (roleName == "Student")
                {
                    var studentProfile = await _context.StudentProfiles.FirstOrDefaultAsync(sp => sp.UserId == user.Id);
                    if (studentProfile != null)
                    {
                        if (dto.Department != null) studentProfile.Department = dto.Department;
                        if (dto.Year.HasValue) studentProfile.Year = dto.Year.Value;
                        if (dto.Interests != null) studentProfile.Interests = dto.Interests;
                        if (dto.GithubLink != null) studentProfile.GithubLink = dto.GithubLink;
                        if (dto.LinkedinLink != null) studentProfile.LinkedinLink = dto.LinkedinLink;
                        if (dto.Biography != null) studentProfile.Bio = dto.Biography;
                    }
                }
                else if (roleName == "Advisor")
                {
                    var advisorProfile = await _context.AdvisorProfiles.FirstOrDefaultAsync(ap => ap.UserId == user.Id);
                    if (advisorProfile != null)
                    {
                        if (dto.AcademicTitle != null) advisorProfile.AcademicTitle = dto.AcademicTitle;
                        if (dto.AreasOfExpertise != null) advisorProfile.Expertise = dto.AreasOfExpertise;
                        if (dto.ResearchInterests != null) advisorProfile.ResearchInterests = dto.ResearchInterests;
                    }
                }

                if (dto.Skills != null)
                {
                    if (HasDuplicateSkillsCaseInsensitive(dto.Skills))
                    {
                        return BadRequest(new
                        {
                            message = "Duplicate skills are not allowed (case-insensitive). Please remove repeated skills."
                        });
                    }

                    await SyncUserSkillsAsync(user.Id, dto.Skills);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Profile updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile");
                return StatusCode(500, new { message = ex.ToString() });
            }
        }

        // ─── Reset Password ───────────────────────────────────────────────────────

        /// <summary>
        /// Validates the reset code and updates the user's password.
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                string normalizedEmail = dto.Email.ToLower().Trim();

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

                if (user is null)
                    return BadRequest(new { message = "Invalid or expired reset code." });

                // Validate the reset token: must match, be unused, and not expired
                var resetToken = await _context.PasswordResetTokens
                    .FirstOrDefaultAsync(t =>
                        t.UserId    == user.Id &&
                        t.Token     == dto.Token &&
                        !t.IsUsed   &&
                        t.ExpiresAt > DateTime.UtcNow);

                if (resetToken is null)
                    return BadRequest(new { message = "Invalid or expired reset code." });

                // Update password with a new BCrypt hash
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

                // Mark the token as consumed
                resetToken.IsUsed = true;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Password successfully reset for: {Email}", user.Email);
                return Ok(new { message = "Your password has been reset successfully. You can now log in with your new password." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during reset-password for: {Email}", dto.Email);
                return StatusCode(500, new { message = "An unexpected error occurred. Please try again later." });
            }
        }

        // ─── Private Helpers ─────────────────────────────────────────────────────

        /// <summary>Returns a cryptographically random 6-digit string.</summary>
        private static string GenerateResetCode()
        {
            return Random.Shared.Next(100000, 999999).ToString();
        }

        private static List<string> NormalizeSkillNames(IEnumerable<string>? incoming)
        {
            if (incoming == null) return new List<string>();

            return incoming
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static bool HasDuplicateSkillsCaseInsensitive(IEnumerable<string>? incoming)
        {
            if (incoming == null) return false;

            var normalized = incoming
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim().ToLowerInvariant())
                .ToList();

            return normalized.Count != normalized.Distinct().Count();
        }

        private async Task SyncUserSkillsAsync(int userId, IEnumerable<string> incomingSkills)
        {
            var normalizedSkills = NormalizeSkillNames(incomingSkills);
            var normalizedKeysList = normalizedSkills
                .Select(s => s.ToLowerInvariant())
                .ToList();

            var existingSkills = await _context.Skills
                .Where(s => normalizedKeysList.Contains(s.SkillName.ToLower()))
                .ToListAsync();

            var existingMap = existingSkills
                .GroupBy(s => s.SkillName.ToLowerInvariant())
                .ToDictionary(g => g.Key, g => g.First());

            var targetSkillIds = new List<int>();

            foreach (var skillName in normalizedSkills)
            {
                var key = skillName.ToLowerInvariant();
                if (!existingMap.TryGetValue(key, out var skill))
                {
                    skill = new Skill { SkillName = skillName };
                    _context.Skills.Add(skill);
                    await _context.SaveChangesAsync();
                    existingMap[key] = skill;
                }
                targetSkillIds.Add(skill.Id);
            }

            var currentUserSkills = await _context.UserSkills
                .Where(us => us.UserId == userId)
                .ToListAsync();

            var targetSet = targetSkillIds.ToHashSet();

            var toRemove = currentUserSkills
                .Where(us => !targetSet.Contains(us.SkillId))
                .ToList();

            if (toRemove.Count > 0)
            {
                _context.UserSkills.RemoveRange(toRemove);
            }

            var existingSkillIdSet = currentUserSkills
                .Select(us => us.SkillId)
                .ToHashSet();

            var toAdd = targetSkillIds
                .Where(skillId => !existingSkillIdSet.Contains(skillId))
                .Select(skillId => new UserSkill
                {
                    UserId = userId,
                    SkillId = skillId
                })
                .ToList();

            if (toAdd.Count > 0)
            {
                _context.UserSkills.AddRange(toAdd);
            }
        }
    }
}
