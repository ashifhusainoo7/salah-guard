using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalahGuardApi.Models;

/// <summary>
/// Represents a completed or interrupted Do Not Disturb session.
/// </summary>
public class DndSession
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string PrayerName { get; set; } = string.Empty;

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    [Required]
    [Range(1, 60)]
    public int DurationMinutes { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Completed";
}
