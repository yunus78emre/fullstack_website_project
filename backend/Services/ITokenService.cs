using backend.Models;

namespace backend.Services
{
    /// <summary>
    /// Defines contract for generating JWT access tokens.
    /// </summary>
    public interface ITokenService
    {
        /// <summary>
        /// Generates a signed JWT token containing the user's ID and role.
        /// </summary>
        string GenerateToken(User user, string roleName);
    }
}
