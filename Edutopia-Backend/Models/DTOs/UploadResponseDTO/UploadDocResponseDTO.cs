namespace Edutopia.Models.DTOs.UploadResponseDTO
{
    public class UploadDocResponseDTO
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public Guid DocumentId { get; set; }
        public string ExtractedText { get; set; }
        public Document document { get; set; } 

        public UploadDocResponseDTO(bool success, string message, Guid documentId, string extractedText)
        {
            Success = success;
            Message = message;
            DocumentId = documentId;
            ExtractedText = extractedText;
            this.document = document;
        }
    }
}
