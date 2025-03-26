using System;
using System.Text.Json.Serialization;
using Edutopia.Utilities;

namespace Edutopia.Models.Entities
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public required string Name { get; set; }
        public required string Email { get; set; }

        // Store the hashed password
        public string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastLoginAt { get; set; }

        [JsonIgnore]
        public virtual ICollection<History> Histories { get; set; }


		/// <summary>
		/// Sets the user's password securely.
		/// </summary>
		public void SetPassword(string password)
        {
            PasswordHash = PasswordHasher.HashPassword(password);
        }

        /// <summary>
        /// Checks if the provided password matches the stored hash.
        /// </summary>
        public bool CheckPassword(string password)
        {
            return PasswordHasher.VerifyPassword(password, PasswordHash);
        }
    }
}
