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



		public SessionService(ApplicationDBContext db, IHttpContextAccessor httpContextAccessor) 
		{
			_httpContextAccessor = httpContextAccessor;
			_db = db;
		}

		public async Task<SesseionResponseDTO> CreateDocSession(Guid documentID)
		{

			var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
				throw new UnauthorizedAccessException("User not authenticated");
			var document = _db.Documents.Where(x => x.Id == documentID).FirstOrDefault();
			
			var session = new History()
			{
				Id = Guid.NewGuid(),
				DocumentId = document.Id,
				UserId = currentUserId
			};
			document.HistoryId = session.Id;
			session.Document = document;
			_db.Documents.Update(document);
			await _db.History.AddAsync(session);
			await _db.SaveChangesAsync();
			return session.ToResponse();

		}

	

		public async Task<SesseionResponseDTO> CreateVideoSession(Guid videoID)
		{
			var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
				throw new UnauthorizedAccessException("User not authenticated");

			var video = _db.Videos.Where(x => x.Id == videoID).FirstOrDefault();
			var session = new History()
			{
				Id = Guid.NewGuid(),
				VideoId = video.Id,
				UserId = currentUserId
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


	}
}
