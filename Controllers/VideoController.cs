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
using System.Collections.Generic;
using System.Text.Json;

namespace Edutopia.Controllers
{
    [Route("api/videos")]
    [ApiController]
    public class VideoController : ControllerBase
    {
        private readonly VideoService _videoService;
        private readonly VideoStatusService _videoStatusService;
        private readonly ApplicationDBContext _dbContext;

        public VideoController(
            VideoService videoService, 
            VideoStatusService videoStatusService,
            ApplicationDBContext dbContext)
        {
            _videoService = videoService;
            _videoStatusService = videoStatusService;
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

        [HttpGet("{id}/status")]
        public async Task<IActionResult> CheckVideoStatus(Guid id)
        {
            var video = await _dbContext.Videos.FindAsync(id);
            if (video == null)
                return NotFound(new { message = "Video not found" });

            // If the status is Error, return the error message directly
            if (video.Status == "Error")
            {
                return Ok(new
                {
                    videoId = id,
                    status = "Error",
                    message = video.Response,
                    detectedObjects = new List<object>(),
                    objectCount = 0
                });
            }

            try
            {
                // Check the current status using the video ID
                var currentStatus = await _videoStatusService.GetVideoStatusAsync(id.ToString());
                
                // Print detailed response data
                Console.WriteLine("\n=== Response Data Before Database Update ===");
                Console.WriteLine($"Video ID: {id}");
                Console.WriteLine($"Current Video Status in DB: {video.Status}");
                Console.WriteLine($"Current Video DiagramCount in DB: {video.DiagramCount}");
                Console.WriteLine("\nAPI Response:");
                Console.WriteLine($"Status: {currentStatus.Status}");
                Console.WriteLine($"Message: {currentStatus.Message}");
                Console.WriteLine($"SessionId: {currentStatus.SessionId}");
                Console.WriteLine($"ObjectCount: {currentStatus.ObjectCount}");
                Console.WriteLine($"DetectedObjects Count: {(currentStatus.DetectedObjects as object[])?.Length ?? 0}");
                if (currentStatus.DetectedObjects != null)
                {
                    Console.WriteLine("\nDetected Objects:");
                    foreach (var obj in currentStatus.DetectedObjects)
                    {
                        Console.WriteLine($"- {obj}");
                    }
                }
                Console.WriteLine("==========================================\n");

                // Update video status in database if it has changed and is not null
                if (currentStatus.Status != null && currentStatus.Status != video.Status)
                {
                    Console.WriteLine("\n=== Updating Database ===");
                    Console.WriteLine($"Old Status: {video.Status}");
                    Console.WriteLine($"New Status: {currentStatus.Status}");
                    Console.WriteLine($"Old DiagramCount: {video.DiagramCount}");
                    Console.WriteLine($"New DiagramCount: {currentStatus.ObjectCount}");
                    Console.WriteLine("========================\n");

                    video.Status = currentStatus.Status;
                    if (currentStatus.Status == "completed")
                    {
                        video.DiagramCount = currentStatus.ObjectCount;
                    }
                    await _dbContext.SaveChangesAsync();
                }

                return Ok(new
                {
                    videoId = id,
                    status = currentStatus.Status ?? video.Status,
                    message = currentStatus.Message,
                    detectedObjects = currentStatus.DetectedObjects,
                    objectCount = currentStatus.ObjectCount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n=== Error in CheckVideoStatus ===");
                Console.WriteLine($"Exception: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                Console.WriteLine("===============================\n");

                return Ok(new
                {
                    videoId = id,
                    status = "Error",
                    message = $"Error checking video status: {ex.Message}",
                    detectedObjects = new List<object>(),
                    objectCount = 0
                });
            }
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
