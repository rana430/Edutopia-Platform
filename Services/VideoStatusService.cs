using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Edutopia.Services
{
    public class VideoStatusResponse
    {
        public bool Success { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
        public string SessionId { get; set; }
        public object[] DetectedObjects { get; set; }
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

        public async Task<VideoStatusResponse> PollVideoStatusAsync(string sessionId, int? maxAttempts = null)
        {
            var attempts = 0;
            var maxAttemptsToUse = maxAttempts ?? _maxAttempts;

            while (attempts < maxAttemptsToUse)
            {
                var status = await GetVideoStatusAsync(sessionId);

                if (status.Status == "completed" || status.Status == "error")
                {
                    return status;
                }

                await Task.Delay(_pollIntervalSeconds * 1000);
                attempts++;
            }

            return new VideoStatusResponse
            {
                Status = "timeout",
                Message = "Video processing timed out",
                Success = false
            };
        }
    }

    public class DetectedObject
    {
        public string Filename { get; set; }
        public string Path { get; set; }
    }
} 