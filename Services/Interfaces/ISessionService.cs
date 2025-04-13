using Edutopia.Models.DTOs.Session;
using Edutopia.Models.Entities;

namespace Edutopia.Services.Interfaces
{
	public interface ISessionService
	{
		Task<SesseionResponseDTO> CreateDocSession(Guid documentID, HttpRequest request);
		Task<SesseionResponseDTO> CreateVideoSession(Guid videoID, HttpRequest request);
		public  Task<bool> DeleteSession(Guid id);
		Task<SesseionResponseDTO> GetSession(Guid id);
        public Task<IEnumerable<SesseionResponseDTO>> GetAllSessionsAsync(HttpRequest request);
	}

}
