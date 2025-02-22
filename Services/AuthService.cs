using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Edutopia.Models.Entities;
using Edutopia.Data;

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
        public string? Login(string email, string password)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null; // Invalid credentials

            return GenerateJwtToken(user);
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
        public string ForgotPassword(string email)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == email);
            if (user == null) return "User not found.";

            var resetToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()); // Simple token
            // Save this token and send via email (Not implemented here)

            return $"Your password reset token: {resetToken}";
        }

        public bool ResetPassword(string email, string newPassword)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == email);
            if (user == null) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword); // Replace with actual hashing logic
            _dbContext.Users.Update(user);
            _dbContext.SaveChanges();

            return true;
        }
    }
}
