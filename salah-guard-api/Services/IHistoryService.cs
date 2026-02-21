using SalahGuardApi.DTOs;

namespace SalahGuardApi.Services;

/// <summary>
/// Service interface for DND session history operations.
/// </summary>
public interface IHistoryService
{
    /// <summary>
    /// Retrieves paginated DND session history with optional prayer name filter.
    /// </summary>
    Task<PaginatedResponse<DndSessionDto>> GetHistoryAsync(int page, int pageSize, string? prayerName, CancellationToken cancellationToken);

    /// <summary>
    /// Logs a new DND session.
    /// </summary>
    Task<DndSessionDto> CreateSessionAsync(DndSessionCreateDto dto, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes a DND session record by ID.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}
