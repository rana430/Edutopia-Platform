using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Edutopia.Services;

namespace Edutopia.Controllers
{
    [Route("api/videos")]
    [ApiController]
    public class VideoController : ControllerBase
    {
        private readonly VideoService _videoService;
        private readonly ApplicationDBContext _dbContext;

        public VideoController(VideoService videoService, ApplicationDBContext dbContext)
        {
            _videoService = videoService;
            _dbContext = dbContext;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadVideo([FromBody] VideoUploadDTO model)
        {
            var result = await _videoService.UploadVideoAsync(model, Request);
            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = "Video URL uploaded successfully", videoId = result.VideoId });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetVideo(Guid id)
        {
            var video = await _dbContext.Videos
                .Select(v => new
                {
                    v.Id,
                    v.VideoUrl,
                    v.Status,
                    v.Response,
                    v.CreatedAt
                })
                .FirstOrDefaultAsync(v => v.Id == id);

            if (video == null)
                return NotFound(new { message = "Video not found" });

            return Ok(video);
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetUserVideos()
        {
            if (!Request.Headers.TryGetValue("Token", out var token))
                return BadRequest(new { message = "Missing token" });

            var authService = HttpContext.RequestServices.GetRequiredService<AuthService>();
            var claims = authService.ValidateResetToken(token);
            if (claims == null)
                return Unauthorized(new { message = "Invalid token" });

            var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized(new { message = "Invalid token claims" });

            var videos = await _dbContext.Videos
                .Where(v => v.UserId == Guid.Parse(userId))
                .Select(v => new
                {
                    v.Id,
                    v.VideoUrl,
                    v.Status,
                    v.Response,
                    v.CreatedAt
                })
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync();

            return Ok(videos);
        }
    }
}
