using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SalahGuardApi.Data;
using SalahGuardApi.DTOs;
using SalahGuardApi.Models;

namespace SalahGuardApi.Services;

/// <summary>
/// Service implementation for prayer schedule operations.
/// </summary>
public class PrayerService : IPrayerService
{
    private readonly SalahGuardDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PrayerService> _logger;

    public PrayerService(SalahGuardDbContext context, IMapper mapper, ILogger<PrayerService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<PrayerDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var prayers = await _context.Prayers
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        prayers = prayers.OrderBy(p => p.ScheduledTime).ToList();

        return _mapper.Map<List<PrayerDto>>(prayers);
    }

    /// <inheritdoc />
    public async Task<PrayerDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var prayer = await _context.Prayers
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return prayer is null ? null : _mapper.Map<PrayerDto>(prayer);
    }

    /// <inheritdoc />
    public async Task<PrayerDto> CreateAsync(PrayerUpdateDto dto, CancellationToken cancellationToken)
    {
        var prayer = new Prayer
        {
            Name = dto.Name ?? string.Empty,
            ArabicName = dto.ArabicName ?? string.Empty,
            ScheduledTime = TimeSpan.ParseExact(dto.ScheduledTime ?? "00:00", @"hh\:mm", null),
            DurationMinutes = dto.DurationMinutes ?? 15,
            IsEnabled = dto.IsEnabled ?? true,
            ActiveDays = JsonSerializer.Serialize(dto.ActiveDays ?? new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" }),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Prayers.Add(prayer);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created prayer schedule: {PrayerName}", prayer.Name);
        return _mapper.Map<PrayerDto>(prayer);
    }

    /// <inheritdoc />
    public async Task<PrayerDto?> UpdateAsync(int id, PrayerUpdateDto dto, CancellationToken cancellationToken)
    {
        var prayer = await _context.Prayers.FindAsync(new object[] { id }, cancellationToken);
        if (prayer is null)
        {
            return null;
        }

        if (dto.Name is not null) prayer.Name = dto.Name;
        if (dto.ArabicName is not null) prayer.ArabicName = dto.ArabicName;
        if (dto.ScheduledTime is not null) prayer.ScheduledTime = TimeSpan.ParseExact(dto.ScheduledTime, @"hh\:mm", null);
        if (dto.DurationMinutes.HasValue) prayer.DurationMinutes = dto.DurationMinutes.Value;
        if (dto.IsEnabled.HasValue) prayer.IsEnabled = dto.IsEnabled.Value;
        if (dto.ActiveDays is not null) prayer.ActiveDays = JsonSerializer.Serialize(dto.ActiveDays);

        prayer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated prayer schedule: {PrayerName} (ID: {PrayerId})", prayer.Name, prayer.Id);
        return _mapper.Map<PrayerDto>(prayer);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var prayer = await _context.Prayers.FindAsync(new object[] { id }, cancellationToken);
        if (prayer is null)
        {
            return false;
        }

        _context.Prayers.Remove(prayer);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted prayer schedule: {PrayerName} (ID: {PrayerId})", prayer.Name, prayer.Id);
        return true;
    }
}
