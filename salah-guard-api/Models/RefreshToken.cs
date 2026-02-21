using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalahGuardApi.Models;

/// <summary>
/// Represents a hashed refresh token stored in the database for JWT rotation.
/// </summary>
public class RefreshToken
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(512)]
    public string TokenHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DeviceId { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsRevoked { get; set; } = false;

    public DateTime? RevokedAt { get; set; }
}
