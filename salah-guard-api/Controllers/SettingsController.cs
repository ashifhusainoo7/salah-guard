using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SalahGuardApi.DTOs;
using SalahGuardApi.Services;

namespace SalahGuardApi.Controllers;

/// <summary>
/// Manages user settings operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly IValidator<SettingsDto> _validator;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SettingsController> _logger;

    private const string SettingsCacheKey = "user_settings";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    public SettingsController(
        ISettingsService settingsService,
        IValidator<SettingsDto> validator,
        IMemoryCache cache,
        ILogger<SettingsController> logger)
    {
        _settingsService = settingsService;
        _validator = validator;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves user settings (cached for 60 seconds).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<SettingsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        if (!_cache.TryGetValue(SettingsCacheKey, out SettingsDto? settings))
        {
            settings = await _settingsService.GetSettingsAsync(cancellationToken);
            _cache.Set(SettingsCacheKey, settings, CacheDuration);
        }

        return Ok(ApiResponse<SettingsDto>.Ok(settings!));
    }

    /// <summary>
    /// Updates user settings.
    /// </summary>
    [HttpPut]
    [ProducesResponseType(typeof(ApiResponse<SettingsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] SettingsDto dto,
        CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Validation failed.",
                validation.Errors.Select(e => e.ErrorMessage).ToList()));
        }

        var settings = await _settingsService.UpdateSettingsAsync(dto, cancellationToken);
        _cache.Remove(SettingsCacheKey);
        return Ok(ApiResponse<SettingsDto>.Ok(settings, "Settings updated."));
    }
}
