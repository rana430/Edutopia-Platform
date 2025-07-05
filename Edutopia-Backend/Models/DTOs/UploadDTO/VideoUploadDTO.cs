using System.ComponentModel.DataAnnotations;

namespace Edutopia.Models.DTOs.UploadDTO
{
    public class VideoUploadDTO
    {
        [Required]
        [MaxLength(500)]
        public string VideoUrl { get; set; }
    }
}
