using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SalahGuardApi.DTOs;
using SalahGuardApi.Services;

namespace SalahGuardApi.Controllers;

/// <summary>
/// Manages prayer schedule CRUD operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrayersController : ControllerBase
{
    private readonly IPrayerService _prayerService;
    private readonly IValidator<PrayerUpdateDto> _validator;
    private readonly IMemoryCache _cache;
    private readonly ILogger<PrayersController> _logger;

    private const string PrayersCacheKey = "prayers_all";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    public PrayersController(
        IPrayerService prayerService,
        IValidator<PrayerUpdateDto> validator,
        IMemoryCache cache,
        ILogger<PrayersController> logger)
    {
        _prayerService = prayerService;
        _validator = validator;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all prayer schedules (cached for 60 seconds).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PrayerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (!_cache.TryGetValue(PrayersCacheKey, out List<PrayerDto>? prayers))
        {
            prayers = await _prayerService.GetAllAsync(cancellationToken);
            _cache.Set(PrayersCacheKey, prayers, CacheDuration);
        }

        return Ok(ApiResponse<List<PrayerDto>>.Ok(prayers!));
    }

    /// <summary>
    /// Retrieves a single prayer schedule by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PrayerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var prayer = await _prayerService.GetByIdAsync(id, cancellationToken);
        if (prayer is null)
        {
            return NotFound(ApiResponse<object>.Fail($"Prayer with ID {id} not found."));
        }

        return Ok(ApiResponse<PrayerDto>.Ok(prayer));
    }

    /// <summary>
    /// Creates a new prayer schedule.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PrayerDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] PrayerUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Validation failed.",
                validation.Errors.Select(e => e.ErrorMessage).ToList()));
        }

        var prayer = await _prayerService.CreateAsync(dto, cancellationToken);
        InvalidateCache();
        return CreatedAtAction(nameof(GetById), new { id = prayer.Id },
            ApiResponse<PrayerDto>.Ok(prayer, "Prayer schedule created."));
    }

    /// <summary>
    /// Updates an existing prayer schedule.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PrayerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] PrayerUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Validation failed.",
                validation.Errors.Select(e => e.ErrorMessage).ToList()));
        }

        var prayer = await _prayerService.UpdateAsync(id, dto, cancellationToken);
        if (prayer is null)
        {
            return NotFound(ApiResponse<object>.Fail($"Prayer with ID {id} not found."));
        }

        InvalidateCache();
        return Ok(ApiResponse<PrayerDto>.Ok(prayer, "Prayer schedule updated."));
    }

    /// <summary>
    /// Deletes a prayer schedule.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _prayerService.DeleteAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound(ApiResponse<object>.Fail($"Prayer with ID {id} not found."));
        }

        InvalidateCache();
        return Ok(ApiResponse<object>.Ok(new { }, "Prayer schedule deleted."));
    }

    private void InvalidateCache()
    {
        _cache.Remove(PrayersCacheKey);
    }
}
