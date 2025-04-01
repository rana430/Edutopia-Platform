using Edutopia.Data;
using Edutopia.Models.DTOs.CreateDTO;
using Edutopia.Services;
using Edutopia.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Security.Claims;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using System.Text.Json;
using System.Text;

namespace Edutopia.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class SessionController : ControllerBase
	{

		private readonly ApplicationDBContext dBContext;
		private readonly ISessionService _sessionService;
        private readonly HttpClient _httpClient;
        string ApiUrl = "http://127.0.0.1:5000/context";


        public SessionController(ApplicationDBContext dBContext, ISessionService sessionService,IHttpClientFactory httpClientFactory)
		{
			this._sessionService = sessionService;
			this.dBContext = dBContext;
            this._httpClient = httpClientFactory.CreateClient();
		}

        [HttpGet("{id}")]

        public async Task<IActionResult> GetSession(Guid id)
		{
			var session = await _sessionService.GetSession(id);

            if (session == null)
				return BadRequest();
            //load ai
            var context = session.summrizedtxt;
            var requestBody = new
            {
                context = context,
            };

            // Serialize and send the request
            var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(ApiUrl, content);
            response.EnsureSuccessStatusCode();
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
