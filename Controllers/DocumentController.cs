using Edutopia.Models.DTOs.UploadDTO;
using Microsoft.AspNetCore.Mvc;
using Edutopia.Services;
using Edutopia.Models.DTOs.UploadDTO;

namespace Edutopia.Controllers
{
    [Route("api/documents")]
    [ApiController]
    public class DocumentController : ControllerBase
    {
        private readonly DocumentService _documentService;

        public DocumentController(DocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] DocumentUploadDTO model)
        {
            var result = await _documentService.UploadDocumentAsync(model, Request);
            if (!result.Success)
                return BadRequest(new { message = result.Message });

            Console.WriteLine(result.Message);

            return Ok(new { message = "File uploaded and processed successfully", documentId = result.DocumentId });
        }
    }
}
