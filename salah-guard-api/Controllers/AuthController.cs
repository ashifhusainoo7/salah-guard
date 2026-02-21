using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalahGuardApi.Auth;
using SalahGuardApi.DTOs;

namespace SalahGuardApi.Controllers;

/// <summary>
/// Handles device authentication and token management.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<DeviceRegisterDto> _registerValidator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        IValidator<DeviceRegisterDto> registerValidator,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _registerValidator = registerValidator;
        _logger = logger;
    }

    /// <summary>
    /// Registers a device and returns JWT access and refresh tokens.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] DeviceRegisterDto dto,
        CancellationToken cancellationToken)
    {
        var validation = await _registerValidator.ValidateAsync(dto, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Validation failed.",
                validation.Errors.Select(e => e.ErrorMessage).ToList()));
        }

        var tokens = await _authService.RegisterDeviceAsync(dto.DeviceId, cancellationToken);
        return Ok(ApiResponse<AuthTokenResponseDto>.Ok(tokens, "Device registered successfully."));
    }

    /// <summary>
    /// Refreshes an access token using a valid refresh token.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken) || string.IsNullOrWhiteSpace(dto.DeviceId))
        {
            return BadRequest(ApiResponse<object>.Fail("Refresh token and device ID are required."));
        }

        var tokens = await _authService.RefreshTokenAsync(dto.RefreshToken, dto.DeviceId, cancellationToken);
        if (tokens is null)
        {
            return Unauthorized(ApiResponse<object>.Fail("Invalid or expired refresh token."));
        }

        return Ok(ApiResponse<AuthTokenResponseDto>.Ok(tokens, "Token refreshed successfully."));
    }

    /// <summary>
    /// Revokes all refresh tokens for the authenticated device (logout).
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var deviceId = User.FindFirst("device_id")?.Value;
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            return BadRequest(ApiResponse<object>.Fail("Device ID not found in token."));
        }

        await _authService.RevokeTokensAsync(deviceId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Logged out successfully."));
    }
}
