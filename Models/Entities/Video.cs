using Edutopia.Models.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

public class Video
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid HistoryId { get; set; }

    [Required]
    [MaxLength(500)]
    public string VideoUrl { get; set; }

    
    [MaxLength(500)]
    public string? status { get; set; }

    public string? Summerization { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? DiagramExtractionStatus { get; set; } = "Processing";


    [MaxLength(50)]
    public string? SummerizationStatus { get; set; } = "Processing";

    public int? DiagramCount { get; set; } = 0;

    [JsonIgnore]
    public ICollection<History> Histories { get; set; }

}

