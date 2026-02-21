using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SalahGuardApi.Data;
using SalahGuardApi.DTOs;
using SalahGuardApi.Models;

namespace SalahGuardApi.Tests.Integration;

/// <summary>
/// A test authentication handler that automatically authenticates all requests
/// so integration tests can bypass JWT validation.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestScheme";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-device-id"),
            new Claim(ClaimTypes.Name, "test-device"),
            new Claim("device_id", "test-device-id")
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

/// <summary>
/// Custom WebApplicationFactory that replaces the database with InMemory
/// and replaces JWT authentication with a test scheme.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureTestServices(services =>
        {
            // Remove the existing DbContext registration
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<SalahGuardDbContext>));
            if (dbContextDescriptor != null)
            {
                services.Remove(dbContextDescriptor);
            }

            // Remove the existing DbContext service
            var dbContextServiceDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(SalahGuardDbContext));
            if (dbContextServiceDescriptor != null)
            {
                services.Remove(dbContextServiceDescriptor);
            }

            // Add InMemory database
            services.AddDbContext<SalahGuardDbContext>(options =>
            {
                options.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid());
            });

            // Replace authentication with test scheme
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                TestAuthHandler.SchemeName, _ => { });

            // Build the service provider and seed the database
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SalahGuardDbContext>();
            context.Database.EnsureCreated();

            // Seed test data
            SeedTestData(context);
        });
    }

    private static void SeedTestData(SalahGuardDbContext context)
    {
        if (context.Prayers.Any()) return;

        var defaultDays = "[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\",\"Sun\"]";

        context.Prayers.AddRange(
            new Prayer
            {
                Name = "Fajr",
                ArabicName = "\u0641\u062C\u0631",
                ScheduledTime = new TimeSpan(5, 0, 0),
                DurationMinutes = 15,
                IsEnabled = true,
                ActiveDays = defaultDays,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Prayer
            {
                Name = "Dhuhr",
                ArabicName = "\u0638\u0647\u0631",
                ScheduledTime = new TimeSpan(13, 0, 0),
                DurationMinutes = 20,
                IsEnabled = true,
                ActiveDays = defaultDays,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Prayer
            {
                Name = "Asr",
                ArabicName = "\u0639\u0635\u0631",
                ScheduledTime = new TimeSpan(16, 30, 0),
                DurationMinutes = 15,
                IsEnabled = true,
                ActiveDays = defaultDays,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        context.UserSettings.Add(new UserSettings
        {
            IsGloballyActive = true,
            SilentNotificationOnStart = true,
            ShowLiftedNotification = true,
            DarkMode = false
        });

        context.SaveChanges();
    }
}

public class PrayersControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PrayersControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        // The TestAuthHandler automatically authenticates; set the header to satisfy any middleware checks
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithPrayers()
    {
        // Act
        var response = await _client.GetAsync("/api/prayers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<List<PrayerDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.Count.Should().BeGreaterOrEqualTo(3);

        // Verify prayers are ordered by ScheduledTime
        body.Data.Should().Contain(p => p.Name == "Fajr");
        body.Data.Should().Contain(p => p.Name == "Dhuhr");
        body.Data.Should().Contain(p => p.Name == "Asr");
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsOk()
    {
        // Arrange - first get all prayers to find a valid ID
        var allResponse = await _client.GetFromJsonAsync<ApiResponse<List<PrayerDto>>>("/api/prayers");
        var existingPrayer = allResponse!.Data!.First();

        // Act
        var response = await _client.GetAsync($"/api/prayers/{existingPrayer.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PrayerDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.Id.Should().Be(existingPrayer.Id);
        body.Data.Name.Should().Be(existingPrayer.Name);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/prayers/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeFalse();
        body.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task Update_ValidDto_ReturnsOk()
    {
        // Arrange - get an existing prayer to update
        var allResponse = await _client.GetFromJsonAsync<ApiResponse<List<PrayerDto>>>("/api/prayers");
        var existingPrayer = allResponse!.Data!.First();

        var updateDto = new PrayerUpdateDto
        {
            DurationMinutes = 25,
            IsEnabled = false
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/prayers/{existingPrayer.Id}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PrayerDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.DurationMinutes.Should().Be(25);
        body.Data.IsEnabled.Should().BeFalse();
        body.Data.Name.Should().Be(existingPrayer.Name); // name unchanged
        body.Message.Should().Contain("updated");
    }
}
