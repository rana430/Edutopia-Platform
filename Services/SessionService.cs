using Azure.Core;
using Edutopia.Data;
using Edutopia.Models.DTOs.Session;
using Edutopia.Models.Entities;
using Edutopia.Models.Entities.Extensions;
using Edutopia.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Reflection.Metadata;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Xml.Linq;

namespace Edutopia.Services
{
	public class SessionService:ISessionService

	{
		private readonly ApplicationDBContext _db;
		private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AuthService _authService;
        private readonly ApplicationDBContext _dbContext;



        public SessionService(ApplicationDBContext db, IHttpContextAccessor httpContextAccessor, AuthService authService, ApplicationDBContext applicationDBContext) 
		{
			_httpContextAccessor = httpContextAccessor;
			_db = db;
            _authService = authService;
            _dbContext = applicationDBContext;
		}

		public async Task<SesseionResponseDTO> CreateDocSession(Guid documentID, HttpRequest request)
		{

            if (!request.Headers.TryGetValue("Token", out var token))
                return null;

            var claims = _authService.ValidateResetToken(token);
            if (claims == null)
                return null;

            var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = _dbContext.Users.FirstOrDefault(u => u.Id.ToString() == userId);

            if (user == null)
                return null;

			var document = await _dbContext.Documents.FindAsync(documentID);
            var session = new History()
			{
				Id = Guid.NewGuid(),
				DocumentId = document.Id,
				UserId = user.Id,
                User = user,
            };
			document.HistoryId = session.Id;
			session.Document = document;
			await _db.History.AddAsync(session);
			await _db.SaveChangesAsync();
			return session.ToResponse();

		}


        public async Task<SesseionResponseDTO> CreateVideoSession(Guid videoID, HttpRequest request)
		{
            if (!request.Headers.TryGetValue("Token", out var token))
                return null;

            var claims = _authService.ValidateResetToken(token);
            if (claims == null)
                return null;

            var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = _dbContext.Users.FirstOrDefault(u => u.Id.ToString() == userId);

            if (user == null)
                return null;

            var video = _db.Videos.Where(x => x.Id == videoID).FirstOrDefault();
			var session = new History()
			{
				Id = Guid.NewGuid(),
				VideoId = video.Id,
				UserId = user.Id,
                
			};
			video.HistoryId = session.Id;
			session.Video = video;
            _db.Videos.Update(video);
			await _db.History.AddAsync(session);
			await _db.SaveChangesAsync();
			return session.ToResponse();

		}

        public async Task<bool> DeleteSession(Guid id)
		{
			// the corosponding file  didnt get deleted yet  ,,, QS
			var session = await _db.History.FindAsync(id);

			if (session == null)
				return false;

			_db.History.Remove(session);
			await _db.SaveChangesAsync();

			return true;
		}

		public async Task<SesseionResponseDTO> GetSession(Guid id)
		{
			var session = await _db.History.FindAsync(id);

			if (session == null)
				throw new KeyNotFoundException("Session not found");

            return _db.History.Include(x => x.User).Include(x => x.Document).Include(x => x.Video).Where(s => s.Id == id).First().ToResponse();



		}

public async Task<IEnumerable<SesseionResponseDTO>> GetAllSessionsAsync(HttpRequest request)
{
    // Always return an empty list instead of null when there's an error
    if (!request.Headers.TryGetValue("Token", out var token))
        return new List<SesseionResponseDTO>();
        
    var claims = _authService.ValidateResetToken(token);
    if (claims == null)
        return new List<SesseionResponseDTO>();
        
    var userId = claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
        return new List<SesseionResponseDTO>();
    
    try
    {
        var sessions = await _db.History
            .Where(x => x.UserId.ToString() == userId)
            .ToListAsync();
            
        if (sessions == null || !sessions.Any())
            return new List<SesseionResponseDTO>();
            
        // Force immediate evaluation with ToList() to avoid deferred execution issues
        var sessionResponses = sessions.Select(y => y.ToResponse()).ToList();
        return sessionResponses;
    }
    catch (Exception ex)
    {
        // Log the exception if you have logging
        return new List<SesseionResponseDTO>();
    }
}

    }
}
