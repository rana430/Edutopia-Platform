using System;
using System.IO;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Edutopia.Services;
using Microsoft.AspNetCore.Hosting;
//using Microsoft.AspNetCore.Http;

public class DocumentService
{
    private readonly ApplicationDBContext _dbContext;
    private readonly IWebHostEnvironment _environment;
    //private readonly HttpClient _httpClient;
    private readonly AuthService _authService;

    public DocumentService(ApplicationDBContext dbContext, IWebHostEnvironment environment, AuthService authService)
    {
        _dbContext = dbContext;
        _environment = environment;
        _authService = authService;
        //_httpClient = httpClient;
    }

    public async Task<(bool Success, string Message, Guid DocumentId)> UploadDocumentAsync(DocumentUploadDTO model, HttpRequest request)
    {
        if (model.File == null || model.File.Length == 0)
            return (false, "Invalid file.", Guid.Empty);

        if (!request.Headers.TryGetValue("Token", out var token))
            return (false, "Missing reset token.", Guid.Empty);

        var claims = _authService.ValidateResetToken(token);
        if (claims == null)
            return (false, "Invalid Token", Guid.Empty);

        var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var user = _dbContext.Users.FirstOrDefault(u => u.Id.ToString() == userId);

        if (user == null)
            return (false, "User Not Found", Guid.Empty);

        // ✅ Ensure `_environment.WebRootPath` is not null
        var rootPath = _environment.WebRootPath ?? _environment.ContentRootPath;
        if (string.IsNullOrEmpty(rootPath))
            return (false, "Server error: WebRootPath is not set.", Guid.Empty);

        // ✅ Ensure "uploads" directory exists
        var uploadsPath = Path.Combine(rootPath, "uploads");
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        // 1️⃣ Store File Locally
        var fileExtension = Path.GetExtension(model.File.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await model.File.CopyToAsync(stream);
        }

        // 2️⃣ Create Document Entry with "Processing" Status
        var document = new Document
        {
            UserId = user.Id,
            Title = model.Title,
            FilePath = filePath,
            FileType = fileExtension,
            Status = "Processing", // AI processing is not yet completed
            Summary = ""
        };

        _dbContext.Documents.Add(document);
        await _dbContext.SaveChangesAsync();

        return (true, "File processed successfully.", document.Id);
    }


    //private async Task<(bool Success, string Summary, string Diagrams)> SendFileToAIModel(string filePath)
    //{
    //    using var form = new MultipartFormDataContent();
    //    form.Add(new ByteArrayContent(await File.ReadAllBytesAsync(filePath)), "file", Path.GetFileName(filePath));

    //    var response = await _httpClient.PostAsync("http://ai-model-endpoint.com/process", form);

    //    if (!response.IsSuccessStatusCode)
    //        return (false, null, null);

    //    var responseBody = await response.Content.ReadAsStringAsync();
    //    var aiResult = JsonSerializer.Deserialize<AIModelResponseDto>(responseBody);

    //    return (true, aiResult.Summary, aiResult.Diagrams);
    //}
}
