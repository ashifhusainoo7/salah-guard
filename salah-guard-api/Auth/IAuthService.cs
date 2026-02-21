using SalahGuardApi.DTOs;

namespace SalahGuardApi.Auth;

/// <summary>
/// Service interface for authentication operations.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a device and returns JWT tokens.
    /// </summary>
    Task<AuthTokenResponseDto> RegisterDeviceAsync(string deviceId, CancellationToken cancellationToken);

    /// <summary>
    /// Refreshes an access token using a valid refresh token.
    /// </summary>
    Task<AuthTokenResponseDto?> RefreshTokenAsync(string refreshToken, string deviceId, CancellationToken cancellationToken);

    /// <summary>
    /// Revokes all refresh tokens for a device (logout).
    /// </summary>
    Task RevokeTokensAsync(string deviceId, CancellationToken cancellationToken);
}
