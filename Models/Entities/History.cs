using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Edutopia.Models.Entities
{
	public class History
	{

		public Guid Id { get; set; }
		public Guid DocumentId { get; set; }
		public Guid UserId { get; set; }
		public Guid VideoId { get; set; }
		public string? User_Message { get; set; }
		public string? response { get; set; }
		public DateTime Created { get; set; }
		public Document? Document { get; set; }
		public User User { get; set; }
		public Video? Video { get; set; }




	}
}

