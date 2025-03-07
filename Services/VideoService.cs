using System;
using System.Threading.Tasks;
using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Microsoft.AspNetCore.Http;

namespace Edutopia.Services
{
    public class VideoService
    {
        private readonly ApplicationDBContext _dbContext;
        private readonly AuthService _authService;

        public VideoService(ApplicationDBContext dbContext, AuthService authService)
        {
            _dbContext = dbContext;
            _authService = authService;
        }

        public async Task<(bool Success, string Message, Guid VideoId)> UploadVideoAsync(VideoUploadDTO model, HttpRequest request)
        {
            if (string.IsNullOrEmpty(model.VideoUrl))
                return (false, "Video URL is required.", Guid.Empty);

            if (!request.Headers.TryGetValue("Token", out var token))
                return (false, "Missing reset token.", Guid.Empty);

            var claims = _authService.ValidateResetToken(token);
            if (claims == null)
                return (false, "Invalid Token", Guid.Empty);

            var userId = claims.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = _dbContext.Users.FirstOrDefault(u => u.Id.ToString() == userId);

            if (user == null)
                return (false, "User Not Found", Guid.Empty);

            var video = new Video
            {
                UserId = user.Id,
                VideoUrl = model.VideoUrl,
                Status = "Active" // Since we're just storing the URL, we can set it as active immediately
            };

            _dbContext.Videos.Add(video);
            await _dbContext.SaveChangesAsync();

            return (true, "Video URL processed successfully.", video.Id);
        }
    }
} 