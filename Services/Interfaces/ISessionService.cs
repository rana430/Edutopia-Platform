using Edutopia.Models.DTOs.Session;
using Edutopia.Models.Entities;

namespace Edutopia.Services.Interfaces
{
	public interface ISessionService
	{
		Task<SesseionResponseDTO> CreateDocSession(Guid documentID);
		Task<SesseionResponseDTO> CreateVideoSession(Guid videoID);
		public  Task<bool> DeleteSession(Guid id);
		Task<SesseionResponseDTO> GetSession(Guid id);
	}

}
