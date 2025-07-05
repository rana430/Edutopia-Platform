using Edutopia.Models.Entities;
using System.Text.Json.Serialization;

namespace Edutopia.Models.DTOs.Session
{
	public class SesseionResponseDTO
	{
		public Guid Id { get; set; }
        public Document? document { get; set; }
        public Video? video { get; set; }
		public string? usr_msgs;
		public string? ai_response;
		public string? summrizedtxt;
        public DateTime? created;
	}
}
