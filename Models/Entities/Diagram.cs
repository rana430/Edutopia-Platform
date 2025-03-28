using System.ComponentModel.DataAnnotations;

namespace Edutopia.Models.Entities
{
    public class Diagram
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid HistoryId { get; set; }

        [Required]
        public string FilePath { get; set; }
    }
}
