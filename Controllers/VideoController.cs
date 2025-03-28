using Edutopia.Data;
using Edutopia.Services.Interfaces;
using Edutopia.Services;
using Microsoft.AspNetCore.Mvc;
using Edutopia.Models.DTOs.UploadDTO;
using Edutopia.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Edutopia.Controllers
{
    [Route("api/video")]
    [ApiController]
    public class VideoController: ControllerBase
    {
        private readonly VideoService _videoService;
        private readonly VideoStatusService _videoStatus;
        private readonly ApplicationDBContext _dbContext;
        private readonly ISessionService _sessionService;
        private readonly ILogger<VideoController> _logger;

        public VideoController(VideoService videoService, VideoStatusService videoStatus, ApplicationDBContext dbContext, ISessionService sessionService, ILogger<VideoController> logger)
        {
            _videoService = videoService;
            _videoStatus = videoStatus;
            _dbContext = dbContext;
            _sessionService = sessionService;
            _logger = logger;
        }

        [HttpGet("{id}/status")]
        public async Task<IActionResult> CheckVideoStatus(Guid id)
        {
            var video = await _dbContext.Videos.FindAsync(id);
            if (video == null)
                return NotFound(new { message = "Video not found" });

            try
            {
                // Fetch video status
                var currentStatus = await _videoStatus.GetVideoStatusAsync(id);

                // Check if the API returned valid data
                if (currentStatus == null)
                {
                    return BadRequest(new { message = "Failed to retrieve video status from the AI model." });
                }

                // Validate HistoryId to prevent null reference exceptions
                if (video.HistoryId == null)
                {
                    return BadRequest(new { message = "Video HistoryId is missing." });
                }

                // Update video object count
                video.DiagramCount = currentStatus.ObjectCount;

                _logger.LogInformation("Checking status for Video ID {VideoId}: {CurrentStatus}", id, currentStatus);

                video.Status = currentStatus.Success ? "Completed" : "Failed";
                // Ensure detected objects exist before saving
                if (currentStatus.DetectedObjects != null && currentStatus.DetectedObjects.Length > 0)
                {
                    foreach (var detectedObject in currentStatus.DetectedObjects)
                    {
                        var diagram = new Diagram
                        {
                            FilePath = detectedObject.Path,
                            HistoryId = video.HistoryId
                        };

                        _dbContext.Diagrams.Add(diagram);
                    }

                    // Save changes after processing all diagrams
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    Console.WriteLine("No detected objects to save.");
                }

                return Ok(new
                {
                    videoId = id,
                    status = video.Status,
                    message = currentStatus.Message,
                    objectCount = currentStatus.ObjectCount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n=== Error in CheckVideoStatus ===");
                Console.WriteLine($"Exception: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }

                Console.WriteLine("===============================\n");

                return StatusCode(500, new
                {
                    videoId = id,
                    status = "Error",
                    message = $"Error checking video status: {ex.Message}",
                    detectedObjects = new List<object>(),
                    objectCount = 0
                });
            }
        }



        [HttpGet("{id}/diagrams")]
        public async Task<IActionResult> GetDiagrams(Guid id)
        {
            try
            {
                var detected_objects = await _videoStatus.GetVideoDiagrams(id);

                foreach( var i in detected_objects)
                {
                    Console.WriteLine(i.FilePath);
                }

                return Ok(new
                {
                    Diagrams = detected_objects
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

    }
}
