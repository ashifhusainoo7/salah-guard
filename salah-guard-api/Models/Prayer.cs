using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalahGuardApi.Models;

/// <summary>
/// Represents a prayer schedule entity with timing and configuration details.
/// </summary>
public class Prayer
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string ArabicName { get; set; } = string.Empty;

    [Required]
    public TimeSpan ScheduledTime { get; set; }

    [Required]
    [Range(5, 30)]
    public int DurationMinutes { get; set; }

    public bool IsEnabled { get; set; } = true;

    [Required]
    [MaxLength(200)]
    public string ActiveDays { get; set; } = "[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\",\"Sun\"]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
