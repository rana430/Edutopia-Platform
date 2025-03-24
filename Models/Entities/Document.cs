using Edutopia.Models.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Document
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid HistoryId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Title { get; set; }

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; }

    [Required]
    [MaxLength(100)]
    public string FileType { get; set; }

	public string Response { get; set; } = "{}";
	public string Summary { get; set; }  // AI-Generated Summary

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Processing";
    public ICollection<History> Histories { get; set;}


}
