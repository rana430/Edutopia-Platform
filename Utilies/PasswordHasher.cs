using BCrypt.Net;

namespace Edutopia.Utilities
{
    public static class PasswordHasher
    {
        /// <summary>
        /// Hashes a plain-text password using BCrypt.
        /// </summary>
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Verifies if the provided password matches the hashed password.
        /// </summary>
        public static bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }
    }
}
