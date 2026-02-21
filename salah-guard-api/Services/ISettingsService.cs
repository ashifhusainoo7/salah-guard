using SalahGuardApi.DTOs;

namespace SalahGuardApi.Services;

/// <summary>
/// Service interface for user settings operations.
/// </summary>
public interface ISettingsService
{
    /// <summary>
    /// Retrieves the current user settings.
    /// </summary>
    Task<SettingsDto> GetSettingsAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Updates user settings.
    /// </summary>
    Task<SettingsDto> UpdateSettingsAsync(SettingsDto dto, CancellationToken cancellationToken);
}
