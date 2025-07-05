using System;
using System.IO;
using System.Net.Http;
using System.Reflection.Metadata;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Edutopia.Models.DTOs.UploadResponseDTO;
using Edutopia.Models.Entities;
using Edutopia.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
//using Microsoft.AspNetCore.Http;

public class DocumentService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ApplicationDBContext _dbContext;
    private readonly IWebHostEnvironment _environment;
    private readonly HttpClient _httpClient;
    private readonly AuthService _authService;
    private readonly string _ocrModelUrl = "http://localhost:5003/process_file";

    public DocumentService(ApplicationDBContext dbContext, IWebHostEnvironment environment, AuthService authService, HttpClient httpClient, IServiceScopeFactory scopeFactory)
    {
        _dbContext = dbContext;
        _environment = environment;
        _authService = authService;
        _httpClient = httpClient;
        _scopeFactory = scopeFactory;
    }

    public async Task<UploadDocResponseDTO> UploadDocumentAsync(DocumentUploadDTO model, HttpRequest request)
    {
        try
        {
            if (model.File == null || model.File.Length == 0)
                return new UploadDocResponseDTO(false, "Invalid file.", Guid.Empty, "");

            if (!request.Headers.TryGetValue("Token", out var token))
                return new UploadDocResponseDTO(false, "Missing reset token.", Guid.Empty, "");

            var claims = _authService.ValidateResetToken(token);
            if (claims == null)
                return new UploadDocResponseDTO(false, "Invalid Token", Guid.Empty, "");

            using (var scope = _scopeFactory.CreateScope())
            {

                var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
                if (user == null)
                    return new UploadDocResponseDTO(false, "User Not Found", Guid.Empty, "");

                var rootPath = _environment.WebRootPath ?? _environment.ContentRootPath;
                if (string.IsNullOrEmpty(rootPath))
                    return new UploadDocResponseDTO(false, "Server error: WebRootPath is not set.", Guid.Empty, "");

                var uploadsPath = Path.Combine(rootPath, "uploads");
                if (!Directory.Exists(uploadsPath))
                    Directory.CreateDirectory(uploadsPath);

                var allowedExtensions = new HashSet<string> { ".pdf", ".txt", ".docx" };
                var fileExtension = Path.GetExtension(model.File.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                    return new UploadDocResponseDTO(false, "Invalid file type. Only PDF, TXT, and DOCX are allowed.", Guid.Empty, "");

                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                await using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.File.CopyToAsync(stream);
                }

                var document = new Document
                {
                    Title = model.Title,
                    FilePath = filePath,
                    FileType = fileExtension,
                    Status = "Processing",
                };

                _dbContext.Documents.Add(document);
                await _dbContext.SaveChangesAsync();

                await SendFileToAIModel(document.Id, filePath);

                var newDocument = await _dbContext.Documents.FindAsync(document.Id);

                return new UploadDocResponseDTO(true, "File processed successfully.", document.Id, newDocument.extractedText);
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error in UploadDocumentAsync: {ex.Message}");
            return new UploadDocResponseDTO(false, "An error occurred while processing the document.", Guid.Empty, "");
        }
    }


    private async Task SendFileToAIModel(Guid documentId, string filePath)
{

        try
        {
            using var form = new MultipartFormDataContent();
            form.Add(new ByteArrayContent(await File.ReadAllBytesAsync(filePath)), "file", Path.GetFileName(filePath));
            var response = await _httpClient.PostAsync(_ocrModelUrl, form);
            Console.WriteLine($"Response status code: {response.StatusCode}");

            var responseContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Raw response content: {responseContent}");

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"API returned status code {response.StatusCode}: {responseContent}");
            }

            Console.WriteLine($"Successfully started processing summarization with video ID: {documentId}");


            var video = await _dbContext.Documents.FindAsync(documentId);
            if (video != null)
            {
                using JsonDocument doc = JsonDocument.Parse(responseContent);
                string summary = doc.RootElement.GetProperty("extracted_text").GetString();

                video.extractedText = summary;
                Console.WriteLine(summary);
                await _dbContext.SaveChangesAsync();
            }

        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"HTTP Request failed: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            throw new Exception($"Failed to connect to API: {ex.Message}", ex);
        }
    }

    public class OcrDocumentResponse
    {
        public string extractedText { get; set; }
    }

}
