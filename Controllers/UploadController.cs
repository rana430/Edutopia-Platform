using Edutopia.Data;
using Edutopia.Models.DTOs.UploadDTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Edutopia.Services;
using Edutopia.Services.Interfaces;
using Edutopia.Models.DTOs.Session;

namespace Edutopia.Controllers
{
	[Route("api/upload")]
	[ApiController]
	public class UploadController : ControllerBase
	{
		private readonly VideoService _videoService;
		private readonly DocumentService _documentService;
		private readonly ApplicationDBContext _dbContext;
		private readonly ISessionService _sessionService;

		public UploadController(
			VideoService videoService,
			DocumentService documentService,
			ApplicationDBContext dbContext, ISessionService sessionService)
		{
			_videoService = videoService;
			_documentService = documentService;
			_dbContext = dbContext;
			_sessionService = sessionService;
		}

		[HttpPost("video")]
		public async Task<SesseionResponseDTO> UploadVideo([FromBody] VideoUploadDTO model)
		{
			var result = await _videoService.UploadVideoAsync(model, Request);
			if (!result.Success)
				return null;

			var sessionResponse=  await _sessionService.CreateVideoSession(result.VideoId, Request);

			return sessionResponse;
		}

		[HttpPost("document")]
		public async Task<IActionResult> UploadDocument([FromForm] DocumentUploadDTO model)
		{
			var result = await _documentService.UploadDocumentAsync(model, Request);
			if (!result.Success)
				return BadRequest(new { message = result.Message });


			Task<SesseionResponseDTO> sessionResponse = _sessionService.CreateDocSession(result.DocumentId, Request);

			return Ok(sessionResponse);
		}
	}
}