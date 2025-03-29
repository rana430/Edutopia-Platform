using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Edutopia.Models.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Edutopia.Services
{
    public class VideoService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AuthService _authService;
        private readonly HttpClient _httpClient;
        private readonly VideoStatusService _videoStatusService;
        private readonly string _transcriptApiUrl = "http://localhost:5000/summarize";
        private readonly string _objectDetectionApiUrl = "http://localhost:5002/process_video";

        public VideoService(
            IServiceScopeFactory scopeFactory,
            AuthService authService,
            IHttpClientFactory httpClientFactory,
            VideoStatusService videoStatusService)
        {
            _scopeFactory = scopeFactory;
            _authService = authService;
            _httpClient = httpClientFactory.CreateClient();
            _videoStatusService = videoStatusService;
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

            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();

                var userId = claims.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);

                if (user == null)
                    return (false, "User Not Found", Guid.Empty);

                var video = new Video
                {
                    VideoUrl = model.VideoUrl,
                    status = "Processing"
                };

                dbContext.Videos.Add(video);
                await dbContext.SaveChangesAsync();

                // Start background processing safely
                _ = Task.Run(() => ProcessVideoAsync(video.Id, model.VideoUrl));

                return (true, "Video URL uploaded and processing started.", video.Id);
            }
        }

        private async Task ProcessSummerizationAsync(string videoUrl, Guid videoId)
        {
            try
            {
                var requestData = new
                {
                    video_url = videoUrl
                };
                var content = new StringContent(
                    JsonSerializer.Serialize(requestData),
                    Encoding.UTF8,
                    "application/json"
                );

                Console.WriteLine($"Sending request to {_transcriptApiUrl}");
                Console.WriteLine($"Request data: {JsonSerializer.Serialize(requestData)}");

                try
                {
                    var response = await _httpClient.PostAsync(_transcriptApiUrl, content);
                    Console.WriteLine($"Response status code: {response.StatusCode}");

                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Raw response content: {responseContent}");

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new Exception($"API returned status code {response.StatusCode}: {responseContent}");
                    }

                    var startResult = JsonSerializer.Deserialize<VideoStatusResponse>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (startResult == null)
                    {
                        throw new Exception($"Failed to deserialize API response. Response content: {responseContent}");
                    }



                    Console.WriteLine($"Successfully started processing summarization with video ID: {videoId}");

                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();

                    var video = await dbContext.Videos.FindAsync(videoId);
                    if (video != null)
                    {
                        using JsonDocument doc = JsonDocument.Parse(responseContent);
                        string summary = doc.RootElement.GetProperty("summary").GetString();

                        video.Summerization = summary;
                        Console.WriteLine(summary);
                        video.SummerizationStatus = "Complete";
                        await dbContext.SaveChangesAsync();
                    }

                }
                catch (HttpRequestException ex)
                {
                    Console.WriteLine($"HTTP Request failed: {ex.Message}");
                    Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                    throw new Exception($"Failed to connect to API: {ex.Message}", ex);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ProcessSummerizationAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }

        private async Task ProcessVideoAsync(Guid videoId, string videoUrl)
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();

            try
            {
                await ProcessDiagramsAsync(videoUrl, videoId);
                await ProcessSummerizationAsync(videoUrl, videoId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing video: {ex.Message}");
                var video = await dbContext.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.DiagramExtractionStatus = "Error";
                    await dbContext.SaveChangesAsync();
                }
            }
        }

        private async Task ProcessDiagramsAsync(string videoUrl, Guid videoId)
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();

            try
            {
                var requestData = new
                {
                    video_url = videoUrl,
                    session_id = videoId.ToString()
                };
                var content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");

                Console.WriteLine($"Sending request to {_objectDetectionApiUrl}");

                var response = await _httpClient.PostAsync(_objectDetectionApiUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    throw new Exception($"API returned status code {response.StatusCode}: {responseContent}");

                var startResult = JsonSerializer.Deserialize<DiagramStartResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                var video = await dbContext.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.DiagramExtractionStatus = startResult != null && startResult.Success ? "Processing" : "Error";
                    await dbContext.SaveChangesAsync();
                }

                Console.WriteLine($"Successfully started processing with video ID: {videoId}");
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"HTTP Request failed: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ProcessDiagramsAsync: {ex.Message}");
            }
        }
    }

    public class DiagramStartResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string SessionId { get; set; }
    }
}
