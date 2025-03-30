using Edutopia.Models.DTOs.Session;
using System.Formats.Asn1;

namespace Edutopia.Models.Entities.Extensions
{
	public static class SessionExtensions
	{
        public static SesseionResponseDTO ToResponse(this History current)
        {
            return new SesseionResponseDTO
            {
                Id = current.Id,
                document = current.Document,
                video = current.Video,
                usr_msgs = current.User_Message,
                ai_response = current.response,
                summrizedtxt = (current.Video?.Summerization?.Length > 2)
                                ? current.Video.Summerization
                                : (current.Document?.extractedText ?? string.Empty) // Ensure a default value if both are null
            };
        }

    }
}
