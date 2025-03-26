using System;
using System.Threading.Tasks;
using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;

namespace Edutopia.Services
{
    public class VideoService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AuthService _authService;
        private readonly HttpClient _httpClient;
        private readonly VideoStatusService _videoStatusService;
        private readonly string _transcriptApiUrl = "http://localhost:5001/process_video";
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
                var user = dbContext.Users.FirstOrDefault(u => u.Id.ToString() == userId);

                if (user == null)
                    return (false, "User Not Found", Guid.Empty);

                var video = new Video
                {
                    UserId = user.Id,
                    VideoUrl = model.VideoUrl,
                    Status = "Processing"
                };

                dbContext.Videos.Add(video);
                await dbContext.SaveChangesAsync();

                // Start background processing
                _ = Task.Run(() => ProcessVideoAsync(video.Id, model.VideoUrl));

                return (true, "Video URL uploaded and processing started.", video.Id);
            }
        }

        private async Task ProcessVideoAsync(Guid videoId, string videoUrl)
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();

            try
            {
                // Process transcript
                var transcriptResult = await ProcessTranscriptAsync(videoUrl);

                // Process diagrams
                var diagramResult = await ProcessDiagramsAsync(videoUrl, videoId);

                var video = await dbContext.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.Status = "Completed";
                    video.DiagramCount = diagramResult.ObjectCount;
                    await dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing video: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                
                var video = await dbContext.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.Status = "Error";
                    video.Response = $"Error processing video: {ex.Message}\nStack Trace: {ex.StackTrace}";
                    await dbContext.SaveChangesAsync();
                }
            }
        }

        private async Task<TranscriptResponse> ProcessTranscriptAsync(string videoUrl)
        {
            var requestData = new { video_url = videoUrl };
            var content = new StringContent(
                JsonSerializer.Serialize(requestData),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(_transcriptApiUrl, content);
            response.EnsureSuccessStatusCode();
            
            return await JsonSerializer.DeserializeAsync<TranscriptResponse>(
                await response.Content.ReadAsStreamAsync());
        }

        private async Task<VideoStatusResponse> ProcessDiagramsAsync(string videoUrl, Guid videoId)
        {
            try
            {
                // Start diagram processing
                var requestData = new { 
                    video_url = videoUrl,
                    session_id = videoId.ToString()  // Send the video ID as session ID
                };
                var content = new StringContent(
                    JsonSerializer.Serialize(requestData),
                    Encoding.UTF8,
                    "application/json"
                );

                Console.WriteLine($"Sending request to {_objectDetectionApiUrl}");
                Console.WriteLine($"Request data: {JsonSerializer.Serialize(requestData)}");

                try
                {
                    var response = await _httpClient.PostAsync(_objectDetectionApiUrl, content);
                    Console.WriteLine($"Response status code: {response.StatusCode}");
                    
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Raw response content: {responseContent}");

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new Exception($"API returned status code {response.StatusCode}: {responseContent}");
                    }

                    var startResult = JsonSerializer.Deserialize<DiagramStartResponse>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (startResult == null)
                    {
                        throw new Exception($"Failed to deserialize API response. Response content: {responseContent}");
                    }

                    if (!startResult.Success)
                    {
                        throw new Exception($"Failed to start diagram processing: {startResult.Message}");
                    }

                    Console.WriteLine($"Successfully started processing with video ID: {videoId}");

                    // Get the initial results from the Flask API
                    var statusResponse = await _videoStatusService.GetVideoStatusAsync(videoId.ToString());
                    
                    // Return the response from the Flask API
                    return new VideoStatusResponse
                    {
                        Success = startResult.Success,
                        Status = statusResponse.Status,
                        Message = startResult.Message,
                        SessionId = startResult.SessionId,
                        DetectedObjects = statusResponse.DetectedObjects,
                        ObjectCount = statusResponse.ObjectCount
                    };
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
                Console.WriteLine($"Error in ProcessDiagramsAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }
    }

    public class TranscriptResponse
    {
        public bool Success { get; set; }
        public string Analysis { get; set; }
    }

    public class DiagramStartResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string SessionId { get; set; }
    }
} 