namespace SalahGuardApi.DTOs;

/// <summary>
/// Data transfer object for user settings.
/// </summary>
public class SettingsDto
{
    public bool IsGloballyActive { get; set; }
    public bool SilentNotificationOnStart { get; set; }
    public bool ShowLiftedNotification { get; set; }
    public bool DarkMode { get; set; }
}
