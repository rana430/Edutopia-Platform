using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Edutopia.Data;
using Edutopia.Models.Entities;

namespace Edutopia.Services
{
    public class VideoStatusResponse
    {
        public bool Success { get; set; }
        public string Status { get; set; }
        [JsonPropertyName("message")]
        public string Message { get; set; }
        [JsonPropertyName("session_id")]
        public string SessionId { get; set; }
        [JsonPropertyName("object_count")]
        public int ObjectCount { get; set; }
        [JsonPropertyName("summerization")]
        public string Summerization { get; set; }
        [JsonPropertyName("detected_objects")]
        public DetectedObject[] DetectedObjects { get; set; }
    }

    public class VideoStatusService
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationDBContext _applicationDBContext;
        private readonly string _baseUrl;
        private readonly ILogger<VideoService> _logger;

        public VideoStatusService(IHttpClientFactory httpClientFactory, ILogger<VideoService> logger, ApplicationDBContext applicationDBContext, string baseUrl = "http://localhost:5002")
        {
            _httpClient = httpClientFactory.CreateClient();
            _baseUrl = baseUrl;
            _logger = logger;

            _applicationDBContext = applicationDBContext;
        }

        public async Task<VideoStatusResponse> GetVideoStatusAsync(Guid sessionId)
        {
            try
            {
                var url = $"{_baseUrl}/get_results/{sessionId}";
                _logger.LogInformation("Requesting video status from URL: {Url}", url);

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                // **Read the raw response content**
                var responseContent = await response.Content.ReadAsStringAsync();

                // **Log full response for debugging**
                _logger.LogInformation("Full response received: {ResponseContent}", responseContent);

                try
                {
                    // **Step 1: Try direct deserialization**
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var videoStatus = JsonSerializer.Deserialize<VideoStatusResponse>(responseContent, options);
                    return videoStatus;
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, "JSON Deserialization Error. Raw Response: {ResponseContent}", responseContent);
                }

                try
                {
                    // **Step 2: Manually parse JSON**
                    using var doc = JsonDocument.Parse(responseContent);
                    var root = doc.RootElement;

                    var videoStatus = new VideoStatusResponse
                    {
                        Success = root.TryGetProperty("success", out var success) && success.GetBoolean(),
                        Message = root.TryGetProperty("message", out var message) ? message.GetString() : "No message",
                        SessionId = root.TryGetProperty("session_id", out var session) ? session.GetString() : sessionId.ToString(),
                        ObjectCount = root.TryGetProperty("object_count", out var count) ? count.GetInt32() : 0,
                        Summerization = root.TryGetProperty("summerization", out var summary) ? summary.GetString() : "No summary",
                        DetectedObjects = root.TryGetProperty("detected_objects", out var objects) && objects.ValueKind == JsonValueKind.Array
                            ? objects.EnumerateArray().Select(ParseDetectedObject).ToArray()
                            : Array.Empty<DetectedObject>()
                    };

                    return videoStatus;
                }
                catch (Exception manualEx)
                {
                    _logger.LogError(manualEx, "Manual JSON parsing failed. Raw Response: {ResponseContent}", responseContent);
                }

                // **Step 3: Return fallback response if parsing fails**
                return new VideoStatusResponse
                {
                    Success = false,
                    Status = "error",
                    Message = "Failed to parse response.",
                    SessionId = sessionId.ToString(),
                    ObjectCount = 0,
                    Summerization = "",
                    DetectedObjects = Array.Empty<DetectedObject>()
                };
            }
            catch (Exception ex)
            {
                var errorResponse = new VideoStatusResponse
                {
                    Success = false,
                    Status = "error",
                    Message = $"Error getting video status: {ex.Message}",
                    SessionId = sessionId.ToString(),
                    ObjectCount = 0,
                    Summerization = "",
                    DetectedObjects = Array.Empty<DetectedObject>()
                };

                _logger.LogError(ex, "Error getting video status for Session ID {SessionId}. Response: {@ErrorResponse}", sessionId, errorResponse);

                return errorResponse;
            }
        }

        // **Helper method to parse DetectedObject safely**
        private DetectedObject ParseDetectedObject(JsonElement element)
        {
            try
            {
                return new DetectedObject
                {
                    Filename = element.TryGetProperty("filename", out var filename) ? filename.GetString() : "unknown",
                    Path = element.TryGetProperty("path", out var path) ? path.GetString() : "unknown"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse DetectedObject.");
                return new DetectedObject();
            }
        }
        public async Task<DiagramResponse> GetVideoDiagramsStatus(Guid videoId)
        {
            try
            {
                var video = await _applicationDBContext.Videos.FindAsync(videoId);
                if (video == null)
                {
                    return new DiagramResponse { message = "No Video for this ID exists" };
                }

                var url = $"{_baseUrl}/get_results/{videoId}";
                _logger.LogInformation("Requesting video status from URL: {Url}", url);

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Full response received: {ResponseContent}", responseContent);

                var videoStatus = DeserializeVideoStatus(responseContent);
                if (videoStatus == null)
                {
                    video.DiagramExtractionStatus = "Error";
                    _logger.LogError("Failed to deserialize video status.");
                    return new DiagramResponse { message = "Error parsing response" };
                }

                ProcessAndSaveDiagrams(video, videoStatus.DetectedObjects);
                return new DiagramResponse { message = "Diagrams returned" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting video status for Video ID {VideoId}", videoId);
                return new DiagramResponse { message = "Error fetching diagrams" };
            }
        }

        private VideoStatusResponse DeserializeVideoStatus(string json)
        {
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return JsonSerializer.Deserialize<VideoStatusResponse>(json, options);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON Deserialization Error. Raw Response: {Json}", json);
                return null;
            }
        }

        private void ProcessAndSaveDiagrams(Video video, DetectedObject[] detectedObjects)
        {
            if (detectedObjects == null || detectedObjects.Length == 0)
            {
                video.DiagramExtractionStatus = "Error";
                _logger.LogWarning("No detected objects to save.");
                return;
            }

            video.DiagramExtractionStatus = "Completed";
            video.DiagramCount = detectedObjects.Length;

            var diagrams = detectedObjects.Select(obj => new Diagram
            {
                FilePath = obj.Path,
                HistoryId = video.HistoryId
            }).ToList();

            _applicationDBContext.Diagrams.AddRange(diagrams);
            _applicationDBContext.SaveChanges();
        }


        public async Task<List<Diagram>> GetVideoDiagrams(Guid videoId)
        {
            try
            {
                var video = await _applicationDBContext.Videos.FindAsync(videoId);
                if (video == null)
                    return new List<Diagram>(); // Return an empty list instead of null

                var diagrams = await _applicationDBContext.Diagrams
                    .Where(d => d.HistoryId == video.HistoryId)
                    .ToListAsync();

                return diagrams;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching diagrams: {ex.Message}");
                return new List<Diagram>(); // Ensure a valid return type even in case of an error
            }
        }
    }

    public class DetectedObject
    {
        public string Filename { get; set; }
        public string Path { get; set; }
    }

    public class DiagramResponse
    {
        public string message { get; set; }
    }
} 