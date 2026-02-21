namespace SalahGuardApi.DTOs;

/// <summary>
/// Request DTO for device registration (anonymous auth for mobile devices).
/// </summary>
public class DeviceRegisterDto
{
    public string DeviceId { get; set; } = string.Empty;
}

/// <summary>
/// Request DTO for refreshing an access token.
/// </summary>
public class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO containing JWT tokens.
/// </summary>
public class AuthTokenResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime AccessTokenExpiresAt { get; set; }
}
