using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SalahGuardApi.Data;
using SalahGuardApi.DTOs;
using SalahGuardApi.Models;

namespace SalahGuardApi.Services;

/// <summary>
/// Service implementation for user settings operations.
/// </summary>
public class SettingsService : ISettingsService
{
    private readonly SalahGuardDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SettingsService> _logger;

    public SettingsService(SalahGuardDbContext context, IMapper mapper, ILogger<SettingsService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<SettingsDto> GetSettingsAsync(CancellationToken cancellationToken)
    {
        var settings = await _context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (settings is null)
        {
            settings = new UserSettings();
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return _mapper.Map<SettingsDto>(settings);
    }

    /// <inheritdoc />
    public async Task<SettingsDto> UpdateSettingsAsync(SettingsDto dto, CancellationToken cancellationToken)
    {
        var settings = await _context.UserSettings.FirstOrDefaultAsync(cancellationToken);

        if (settings is null)
        {
            settings = _mapper.Map<UserSettings>(dto);
            _context.UserSettings.Add(settings);
        }
        else
        {
            settings.IsGloballyActive = dto.IsGloballyActive;
            settings.SilentNotificationOnStart = dto.SilentNotificationOnStart;
            settings.ShowLiftedNotification = dto.ShowLiftedNotification;
            settings.DarkMode = dto.DarkMode;
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Updated user settings");
        return _mapper.Map<SettingsDto>(settings);
    }
}
