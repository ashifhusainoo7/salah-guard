namespace SalahGuardApi.DTOs;

/// <summary>
/// Data transfer object for prayer schedule data.
/// </summary>
public class PrayerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ArabicName { get; set; } = string.Empty;
    public string ScheduledTime { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public bool IsEnabled { get; set; }
    public List<string> ActiveDays { get; set; } = new();
}

/// <summary>
/// Request DTO for creating or updating a prayer schedule.
/// </summary>
public class PrayerUpdateDto
{
    public string? Name { get; set; }
    public string? ArabicName { get; set; }
    public string? ScheduledTime { get; set; }
    public int? DurationMinutes { get; set; }
    public bool? IsEnabled { get; set; }
    public List<string>? ActiveDays { get; set; }
}
