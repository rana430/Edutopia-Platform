using Edutopia.Models.DTOs.Session;
using System.Formats.Asn1;

namespace Edutopia.Models.Entities.Extensions
{
	public static class SessionExtensions
	{
		public static SesseionResponseDTO ToResponse(this History current)
		{


			return new SesseionResponseDTO { document = current.Document, video = current.Video, Id = current.Id, usr_msgs = current.User_Message, ai_response = current.response,summrizedtxt=current.Video.Response.Length>2 ? current.Video.Response: current.Document.Response };
		}

	}
}
