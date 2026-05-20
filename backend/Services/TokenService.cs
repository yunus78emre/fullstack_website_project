using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <inheritdoc />
        public string GenerateToken(User user, string roleName)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var rawKey = jwtSettings["Key"]
                ?? throw new InvalidOperationException("JWT Key is not configured in appsettings.");

            var signingKey  = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(rawKey));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub,  user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier,    user.Id.ToString()),
                new Claim(ClaimTypes.Email,             user.Email),
                new Claim(ClaimTypes.Role,              roleName),
                new Claim(JwtRegisteredClaimNames.Jti,  Guid.NewGuid().ToString())
            };

            var expiresInHours = int.TryParse(jwtSettings["ExpiresInHours"], out int hours) ? hours : 24;

            var token = new JwtSecurityToken(
                issuer:            jwtSettings["Issuer"],
                audience:          jwtSettings["Audience"],
                claims:            claims,
                expires:           DateTime.UtcNow.AddHours(expiresInHours),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
