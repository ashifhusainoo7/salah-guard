using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalahGuardApi.DTOs;
using SalahGuardApi.Services;

namespace SalahGuardApi.Controllers;

/// <summary>
/// Manages DND session history operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistoryController : ControllerBase
{
    private readonly IHistoryService _historyService;
    private readonly IValidator<DndSessionCreateDto> _validator;
    private readonly ILogger<HistoryController> _logger;

    public HistoryController(
        IHistoryService historyService,
        IValidator<DndSessionCreateDto> validator,
        ILogger<HistoryController> logger)
    {
        _historyService = historyService;
        _validator = validator;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves paginated DND session history with optional prayer name filter.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<DndSessionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? prayerName = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var result = await _historyService.GetHistoryAsync(page, pageSize, prayerName, cancellationToken);
        return Ok(ApiResponse<PaginatedResponse<DndSessionDto>>.Ok(result));
    }

    /// <summary>
    /// Logs a new DND session.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DndSessionDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] DndSessionCreateDto dto,
        CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Validation failed.",
                validation.Errors.Select(e => e.ErrorMessage).ToList()));
        }

        var session = await _historyService.CreateSessionAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetHistory), null,
            ApiResponse<DndSessionDto>.Ok(session, "DND session logged."));
    }

    /// <summary>
    /// Deletes a DND session record.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _historyService.DeleteAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound(ApiResponse<object>.Fail($"DND session with ID {id} not found."));
        }

        return Ok(ApiResponse<object>.Ok(new { }, "DND session deleted."));
    }
}
