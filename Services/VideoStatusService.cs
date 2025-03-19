using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

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
        [JsonPropertyName("detected_objects")]
        public object[] DetectedObjects { get; set; }
        [JsonPropertyName("object_count")]
        public int ObjectCount { get; set; }
    }

    public class VideoStatusService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly int _maxAttempts;
        private readonly int _pollIntervalSeconds;

        public VideoStatusService(IHttpClientFactory httpClientFactory, string baseUrl = "http://localhost:5002")
        {
            _httpClient = httpClientFactory.CreateClient();
            _baseUrl = baseUrl;
            _maxAttempts = 60; // 5 minutes with 5-second intervals
            _pollIntervalSeconds = 5;
        }

        public async Task<VideoStatusResponse> GetVideoStatusAsync(string sessionId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/get_results/{sessionId}");
                response.EnsureSuccessStatusCode();

                return await JsonSerializer.DeserializeAsync<VideoStatusResponse>(
                    await response.Content.ReadAsStreamAsync());
            }
            catch (Exception ex)
            {
                return new VideoStatusResponse
                {
                    Status = "error",
                    Message = $"Error getting video status: {ex.Message}",
                    Success = false
                };
            }
        }

    }

    public class DetectedObject
    {
        public string Filename { get; set; }
        public string Path { get; set; }
    }
} 