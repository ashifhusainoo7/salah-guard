using SalahGuardApi.DTOs;

namespace SalahGuardApi.Services;

/// <summary>
/// Service interface for prayer schedule operations.
/// </summary>
public interface IPrayerService
{
    /// <summary>
    /// Retrieves all prayer schedules.
    /// </summary>
    Task<List<PrayerDto>> GetAllAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves a single prayer schedule by ID.
    /// </summary>
    Task<PrayerDto?> GetByIdAsync(int id, CancellationToken cancellationToken);

    /// <summary>
    /// Creates a new prayer schedule.
    /// </summary>
    Task<PrayerDto> CreateAsync(PrayerUpdateDto dto, CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing prayer schedule.
    /// </summary>
    Task<PrayerDto?> UpdateAsync(int id, PrayerUpdateDto dto, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes a prayer schedule by ID.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}
