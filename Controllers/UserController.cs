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

        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword([FromBody] ForgotPasswordDTO dto)
        {
            var result = _authService.ForgotPassword(dto.Email);
            return Ok(new { Message = result });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO model)
        {
            var result = _authService.ResetPassword(model.Token, model.NewPassword);
            if (!result)
                return BadRequest("Invalid or expired token");

            return Ok(new { Message = "Password reset successful" });
        }


    }
}
