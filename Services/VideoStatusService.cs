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
        public string summery { get; set; }
        [JsonPropertyName("detected_objects")]
        public DetectedObject[] DetectedObjects { get; set; }
    }

    public class VideoStatusService
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationDBContext _applicationDBContext;
        private readonly string _diagramsModelUrl = "http://localhost:5002";
        private readonly string _summerizationModelUrl = "http://localhost:5001";
        private readonly ILogger<VideoService> _logger;

        public VideoStatusService(IHttpClientFactory httpClientFactory, ILogger<VideoService> logger, ApplicationDBContext applicationDBContext)
        {
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;

            _applicationDBContext = applicationDBContext;
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

                var url = $"{_diagramsModelUrl}/get_results/{videoId}";
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
                if (videoStatus.Status != "processing")
                {
                    ProcessAndSaveDiagrams(video, videoStatus.DetectedObjects);
                    return new DiagramResponse { message = "Diagrams returned" };

                }
                else
                {
                    return new DiagramResponse { message = "Diagrams still in Processing" };
                }
                 
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