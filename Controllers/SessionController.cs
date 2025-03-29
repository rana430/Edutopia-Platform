using Edutopia.Data;
using Edutopia.Models.DTOs.CreateDTO;
using Edutopia.Services;
using Edutopia.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Edutopia.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class SessionController : ControllerBase
	{

		private readonly ApplicationDBContext dBContext;
		private readonly ISessionService _sessionService;



		public SessionController(ApplicationDBContext dBContext, ISessionService sessionService)
		{
			this._sessionService = sessionService;
			this.dBContext = dBContext;
		}

        [HttpGet("{id}")]

        public async Task<IActionResult> GetSession(Guid id)
		{
			var session = await _sessionService.GetSession(id);
			
			if (session == null)
				return BadRequest();
			return Ok(session);



		}

		[HttpGet("delete/{id}")]
		public async Task<IActionResult> DeleteSession(Guid id)
		{
			var result = await _sessionService.DeleteSession(id);
			if (!result)
				return NotFound();
			return Ok();
		}



	}
}
