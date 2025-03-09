using Edutopia.Models.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Video
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
	[Required]
	public Guid HistoryId { get; set; }
	[Required]
    [MaxLength(500)]
    public string VideoUrl { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Response { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Processing";
	public ICollection<History> Histories { get; set; }

}
