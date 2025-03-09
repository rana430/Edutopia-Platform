using System;
using System.Threading.Tasks;
using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.EntityFrameworkCore;

namespace Edutopia.Services
{
    public class VideoService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AuthService _authService;
        private readonly HttpClient _httpClient;
        private readonly string _transcriptApiUrl = "http://localhost:5001/process_video";
        private readonly string _objectDetectionApiUrl = "http://localhost:5002/detect_objects";

        public VideoService(IServiceScopeFactory scopeFactory, AuthService authService, IHttpClientFactory httpClientFactory)
        {
            _scopeFactory = scopeFactory;
            _authService = authService;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task<(bool Success, string Message, Guid VideoId)> UploadVideoAsync(VideoUploadDTO model, HttpRequest request)
        {
            
			if (string.IsNullOrEmpty(model.VideoUrl))
                return (false, "Video URL is required.", Guid.Empty);

            if (!request.Headers.TryGetValue("Token", out var token))
                return (false, "Missing reset token.", Guid.Empty);

            var claims = _authService.ValidateResetToken(token); //solve with authorize.use auth
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
                   //removed user id
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
                var requestData = new { video_url = videoUrl };
                var content = new StringContent(
                    JsonSerializer.Serialize(requestData),
                    Encoding.UTF8,
                    "application/json"
                );

                Console.WriteLine($"Sending request to transcript API: {_transcriptApiUrl}");
                
                var transcriptResponse = await _httpClient.PostAsync(_transcriptApiUrl, content);
                var responseContent = await transcriptResponse.Content.ReadAsStringAsync();
                Console.WriteLine($"Response status: {transcriptResponse.StatusCode}");
                Console.WriteLine($"Response content: {responseContent}");
                
                transcriptResponse.EnsureSuccessStatusCode();
                
                Console.WriteLine("Attempting to deserialize response...");
                var transcriptResult = await JsonSerializer.DeserializeAsync<TranscriptResponse>(
                    await transcriptResponse.Content.ReadAsStreamAsync());
                Console.WriteLine($"Deserialized response - Success: {transcriptResult?.Success}, Analysis present: {transcriptResult?.Analysis != null}");
                
                if (transcriptResult?.Analysis == null)
                {
                    Console.WriteLine("Warning: Analysis is null in the response");
                    // Try parsing the raw response to see what we got
                    var rawResponse = JsonDocument.Parse(responseContent);
                    Console.WriteLine($"Raw response structure: {JsonSerializer.Serialize(rawResponse, new JsonSerializerOptions { WriteIndented = true })}");
                }
                //here
                Console.WriteLine("Video processing successful");
                var video = await dbContext.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.Response = responseContent;
                    video.Status = "Completed";
                    await dbContext.SaveChangesAsync();
                }
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"HTTP Request Error: {ex.Message}");
                Console.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
                
                var video = await dbContext.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.Status = "Error";
                    video.Response = $"HTTP Request Error: {ex.Message}. Inner Exception: {ex.InnerException?.Message}";
                    await dbContext.SaveChangesAsync();
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"JSON Parsing Error: {ex.Message}");
                
                var video = await dbContext.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.Status = "Error";
                    video.Response = $"JSON Parsing Error: {ex.Message}";
                    await dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"General Error: {ex.Message}");
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
    }

    public class TranscriptResponse
    {
        public bool Success { get; set; }
        public string Analysis { get; set; }
    }

    public class RelevantSection
    {
        public string Content { get; set; }
        public double RelevanceScore { get; set; }
    }

    public class ObjectDetectionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<DetectedObject> DetectedObjects { get; set; }
        public int ObjectCount { get; set; }
    }

    public class DetectedObject
    {
        public string ClassName { get; set; }
        public double Confidence { get; set; }
        public string Resolution { get; set; }
        public string FilePath { get; set; }
    }
} 