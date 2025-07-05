using System.ComponentModel.DataAnnotations;

namespace Edutopia.Models.DTOs.UploadDTO
{
    public class DocumentUploadDTO
    {
        [Required]
        public string Title { get; set; }

        [Required]
        public IFormFile File { get; set; } // File to be uploaded
    }

}
