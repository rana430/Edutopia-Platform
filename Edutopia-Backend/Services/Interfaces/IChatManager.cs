using Edutopia.Models.DTOs.Session;

namespace Edutopia.Services.Interfaces
{
    public interface IChatManager
    {

        public void LoadContext(Guid  sessionId);
        public void GetResponse(Guid sessionId);
    }
}
