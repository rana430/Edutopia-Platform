using System.ComponentModel.DataAnnotations;

namespace Edutopia.Models.Entities
{
    public class Diagram
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid DocumentId { get; set; }
    }
}
