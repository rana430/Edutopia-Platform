using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Edutopia.Models.Entities;
using Edutopia.Data;
using Azure;

namespace Edutopia.Services
{
    public class AuthService
    {
        private readonly ApplicationDBContext _dbContext;
        private readonly IConfiguration _config;

        public AuthService(ApplicationDBContext dbContext, IConfiguration config)
        {
            _dbContext = dbContext;
            _config = config;
        }

        /// <summary>
        /// Registers a new user.
        /// </summary>
        public User? Register(string name, string email, string password)
        {
            if (_dbContext.Users.Any(u => u.Email == email))
                return null; // Email already exists

            var user = new User
            {
                Name = name,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();

            return user;
        }

        /// <summary>
        /// Logs in and returns a JWT token.
        /// </summary>
        public string? Login(string email, string password, HttpResponse response)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null; // Invalid credentials

            user.LastLoginAt = DateTime.UtcNow;

            var token = GenerateResetToken(user);

            // Set token in response header
            response.Headers["Token"] = token;
            return "User Logged in Successfully";
        }

        /// <summary>
        /// Generates a JWT token for a user.
        /// </summary>
        private string GenerateJwtToken(User user)
        {
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Email, user.Email)
                }),
                Expires = DateTime.UtcNow.AddHours(3),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Handles password reset by generating a reset token.
        /// (You need to implement email sending for real use)
        /// </summary>
        public string ForgotPassword(string email, HttpResponse response)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == email);
            if (user == null) return "User not found.";

            var token = GenerateResetToken(user);

            // Set token in response header
            response.Headers["Token"] = token;

            // TODO: Send token via email

            return "A password reset link has been sent to your email.";
        }

        private string GenerateResetToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()) // Store user ID in the token
            }),
                Expires = DateTime.UtcNow.AddHours(24),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string ResetPassword(string newPassword, HttpRequest request)
        {
            if (!request.Headers.TryGetValue("Token", out var token))
                return "Missing reset token.";

            var claims = ValidateResetToken(token);
            if (claims == null)
                return "Invalid or expired reset token.";

            var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = _dbContext.Users.FirstOrDefault(u => u.Id.ToString() == userId);

            if (user == null)
                return "User not found.";

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

            _dbContext.Users.Update(user);
            _dbContext.SaveChanges();

            return "Password has been successfully reset.";
        }

        public ClaimsPrincipal ValidateResetToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

            try
            {
                var claims = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return claims;
            }
            catch
            {
                return null; // Token is invalid or expired
            }
        }

    }
}
