using Microsoft.AspNetCore.Mvc;
using Edutopia.Services;
using Edutopia.Models.DTOs.CreateDTO;

namespace Edutopia.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDTO dto)
        {
            var user = _authService.Register(dto.Name, dto.Email, dto.Password);
            if (user == null)
                return BadRequest("Email already exists.");

            return Ok(new { user.Id, user.Name, user.Email, user.CreatedAt });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO dto)
        {
            var token = _authService.Login(dto.Email, dto.Password);
            if (token == null)
                return Unauthorized("Invalid credentials.");

            return Ok(new { Token = token });
        }

        /// <summary>
        /// Initiates a password reset request. 
        /// Sends a reset token in the response header.
        /// </summary>
        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword([FromBody] ForgotPasswordDTO request)
        {
            var result = _authService.ForgotPassword(request.Email, Response);

            if (result == "User not found.")
                return NotFound(new { message = result });

            return Ok(new { message = result });
        }

        /// <summary>
        /// Resets the user's password using a token from the request header.
        /// </summary>
        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordDTO request)
        {
            var result = _authService.ResetPassword(request.NewPassword, Request);

            if (result == "Missing reset token." || result == "Invalid or expired reset token." || result == "User not found.")
                return BadRequest(new { message = result });

            return Ok(new { message = result });
        }
    }
}
