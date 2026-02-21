namespace SalahGuardApi.Auth;

/// <summary>
/// Configuration settings for JWT token generation and validation.
/// </summary>
public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "SalahGuardApi";
    public string Audience { get; set; } = "SalahGuardMobile";
    public int AccessTokenExpiryMinutes { get; set; } = 15;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
