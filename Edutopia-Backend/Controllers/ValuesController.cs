using Edutopia.Data;
using Edutopia.Models.DTOs.NewFolder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace Edutopia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {   
        ApplicationDBContext dBContext;
        private readonly HttpClient _httpClient;
        string ApiUrl = "http://127.0.0.1:5000/query";

        public ChatController(ApplicationDBContext dBContext, IHttpClientFactory httpClientFactory)
        {
            this.dBContext = dBContext;
            this._httpClient = httpClientFactory.CreateClient();

        }
            [HttpPost("c")]

            public async Task<IActionResult> GetResponse( [FromBody] QueryDTO queryDto )
            {
            var id = queryDto.id;
              Guid.TryParse(id, out var chatId);
                 var session = await dBContext.History.FirstAsync(x=>x.Id== chatId);
            /*   if (session != null)
               {
                   return BadRequest();
               }*/

                string query = queryDto.query;

                var requestBody = new
                {
                    query = query,
                };

                // Serialize and send the request
                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync(ApiUrl, content);
                response.EnsureSuccessStatusCode();
                var responseContent = await response.Content.ReadAsStringAsync();
            session.User_Message += query + ",";
            session.response += responseContent + ",";
            dBContext.History.Update(session);
            await dBContext.SaveChangesAsync();

            return Ok(responseContent);
            }
        

    }

}
