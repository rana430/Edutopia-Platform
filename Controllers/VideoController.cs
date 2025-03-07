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

        public VideoController(VideoService videoService)
        {
            _videoService = videoService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadVideo([FromBody] VideoUploadDTO model)
        {
            var result = await _videoService.UploadVideoAsync(model, Request);
            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = "Video URL uploaded successfully", videoId = result.VideoId });
        }
    }
}
