using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SalahGuardApi.Data;
using SalahGuardApi.DTOs;
using SalahGuardApi.Models;

namespace SalahGuardApi.Auth;

/// <summary>
/// Service implementation for JWT authentication with refresh token rotation.
/// </summary>
public class AuthService : IAuthService
{
    private readonly SalahGuardDbContext _context;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(SalahGuardDbContext context, IOptions<JwtSettings> jwtSettings, ILogger<AuthService> logger)
    {
        _context = context;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<AuthTokenResponseDto> RegisterDeviceAsync(string deviceId, CancellationToken cancellationToken)
    {
        // Revoke any existing tokens for this device
        await RevokeTokensAsync(deviceId, cancellationToken);

        var accessToken = GenerateAccessToken(deviceId);
        var refreshToken = GenerateRefreshToken();
        var refreshTokenHash = HashToken(refreshToken);

        var tokenEntity = new RefreshToken
        {
            TokenHash = refreshTokenHash,
            DeviceId = deviceId,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(tokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Device registered: {DeviceId}", deviceId);

        return new AuthTokenResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
        };
    }

    /// <inheritdoc />
    public async Task<AuthTokenResponseDto?> RefreshTokenAsync(string refreshToken, string deviceId, CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(refreshToken);

        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(t =>
                t.TokenHash == tokenHash &&
                t.DeviceId == deviceId &&
                !t.IsRevoked &&
                t.ExpiresAt > DateTime.UtcNow,
                cancellationToken);

        if (storedToken is null)
        {
            _logger.LogWarning("Invalid refresh token attempt for device: {DeviceId}", deviceId);
            return null;
        }

        // Rotate: revoke old token and issue new pair
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;

        var newAccessToken = GenerateAccessToken(deviceId);
        var newRefreshToken = GenerateRefreshToken();
        var newRefreshTokenHash = HashToken(newRefreshToken);

        var newTokenEntity = new RefreshToken
        {
            TokenHash = newRefreshTokenHash,
            DeviceId = deviceId,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(newTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Token rotated for device: {DeviceId}", deviceId);

        return new AuthTokenResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
        };
    }

    /// <inheritdoc />
    public async Task RevokeTokensAsync(string deviceId, CancellationToken cancellationToken)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.DeviceId == deviceId && !t.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        if (tokens.Count > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Revoked {Count} token(s) for device: {DeviceId}", tokens.Count, deviceId);
        }
    }

    private string GenerateAccessToken(string deviceId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, deviceId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("device_id", deviceId)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
