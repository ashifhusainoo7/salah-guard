using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalahGuardApi.Models;

/// <summary>
/// Stores user-specific application settings.
/// </summary>
public class UserSettings
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public bool IsGloballyActive { get; set; } = true;

    public bool SilentNotificationOnStart { get; set; } = true;

    public bool ShowLiftedNotification { get; set; } = true;

    public bool DarkMode { get; set; } = false;
}
