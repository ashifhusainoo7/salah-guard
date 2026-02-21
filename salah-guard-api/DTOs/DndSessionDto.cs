namespace SalahGuardApi.DTOs;

/// <summary>
/// Data transfer object for DND session data.
/// </summary>
public class DndSessionDto
{
    public int Id { get; set; }
    public string PrayerName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Request DTO for creating a new DND session record.
/// </summary>
public class DndSessionCreateDto
{
    public string PrayerName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = "Completed";
}

/// <summary>
/// Paginated response wrapper for DND session history.
/// </summary>
public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}
