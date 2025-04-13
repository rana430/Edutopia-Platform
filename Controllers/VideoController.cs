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

        [HttpGet("{id}/diagrams/status")]
        public async Task<IActionResult> CheckVideoDiagramsStatus(Guid id)
        {
            try
            {
                // Fetch video status
                var currentStatus = await _videoStatus.GetVideoDiagramsStatus(id);


                _logger.LogInformation("Checking status for Video ID {VideoId}: {CurrentStatus}", id, currentStatus);

                return Ok(new
                {
                    videoId = id,
                    message = currentStatus.message
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
                Console.WriteLine(id);
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
