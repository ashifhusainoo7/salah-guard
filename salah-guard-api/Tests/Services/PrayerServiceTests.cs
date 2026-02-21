using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SalahGuardApi.Data;
using SalahGuardApi.DTOs;
using SalahGuardApi.Mapping;
using SalahGuardApi.Models;
using SalahGuardApi.Services;

namespace SalahGuardApi.Tests.Services;

public class PrayerServiceTests : IDisposable
{
    private readonly SalahGuardDbContext _context;
    private readonly IMapper _mapper;
    private readonly PrayerService _sut;

    public PrayerServiceTests()
    {
        var options = new DbContextOptionsBuilder<SalahGuardDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new SalahGuardDbContext(options);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });
        _mapper = mapperConfig.CreateMapper();

        var logger = new Mock<ILogger<PrayerService>>();

        _sut = new PrayerService(_context, _mapper, logger.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private async Task<Prayer> SeedPrayerAsync(
        string name = "Fajr",
        string arabicName = "\u0641\u062C\u0631",
        TimeSpan? scheduledTime = null,
        int durationMinutes = 15,
        bool isEnabled = true)
    {
        var prayer = new Prayer
        {
            Name = name,
            ArabicName = arabicName,
            ScheduledTime = scheduledTime ?? new TimeSpan(5, 0, 0),
            DurationMinutes = durationMinutes,
            IsEnabled = isEnabled,
            ActiveDays = "[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\",\"Sun\"]",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Prayers.Add(prayer);
        await _context.SaveChangesAsync();
        return prayer;
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllPrayers()
    {
        // Arrange
        await SeedPrayerAsync("Fajr", "\u0641\u062C\u0631", new TimeSpan(5, 0, 0));
        await SeedPrayerAsync("Dhuhr", "\u0638\u0647\u0631", new TimeSpan(13, 0, 0));
        await SeedPrayerAsync("Asr", "\u0639\u0635\u0631", new TimeSpan(16, 30, 0));

        // Act
        var result = await _sut.GetAllAsync(CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result[0].Name.Should().Be("Fajr");
        result[1].Name.Should().Be("Dhuhr");
        result[2].Name.Should().Be("Asr");
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsPrayer()
    {
        // Arrange
        var seeded = await SeedPrayerAsync("Fajr", "\u0641\u062C\u0631", new TimeSpan(5, 0, 0), 15);

        // Act
        var result = await _sut.GetByIdAsync(seeded.Id, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(seeded.Id);
        result.Name.Should().Be("Fajr");
        result.ArabicName.Should().Be("\u0641\u062C\u0631");
        result.ScheduledTime.Should().Be("05:00");
        result.DurationMinutes.Should().Be(15);
        result.IsEnabled.Should().BeTrue();
        result.ActiveDays.Should().Contain("Mon");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Act
        var result = await _sut.GetByIdAsync(999, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesPrayer()
    {
        // Arrange
        var dto = new PrayerUpdateDto
        {
            Name = "Maghrib",
            ArabicName = "\u0645\u063A\u0631\u0628",
            ScheduledTime = "19:00",
            DurationMinutes = 15,
            IsEnabled = true,
            ActiveDays = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" }
        };

        // Act
        var result = await _sut.CreateAsync(dto, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Maghrib");
        result.ArabicName.Should().Be("\u0645\u063A\u0631\u0628");
        result.ScheduledTime.Should().Be("19:00");
        result.DurationMinutes.Should().Be(15);
        result.IsEnabled.Should().BeTrue();
        result.Id.Should().BeGreaterThan(0);

        // Verify persisted in database
        var persisted = await _context.Prayers.FirstOrDefaultAsync(p => p.Name == "Maghrib");
        persisted.Should().NotBeNull();
        persisted!.ScheduledTime.Should().Be(new TimeSpan(19, 0, 0));
    }

    [Fact]
    public async Task UpdateAsync_ExistingId_UpdatesPrayer()
    {
        // Arrange
        var seeded = await SeedPrayerAsync("Fajr", "\u0641\u062C\u0631", new TimeSpan(5, 0, 0), 15);

        var dto = new PrayerUpdateDto
        {
            ScheduledTime = "05:30",
            DurationMinutes = 20,
            IsEnabled = false
        };

        // Act
        var result = await _sut.UpdateAsync(seeded.Id, dto, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.ScheduledTime.Should().Be("05:30");
        result.DurationMinutes.Should().Be(20);
        result.IsEnabled.Should().BeFalse();
        result.Name.Should().Be("Fajr"); // unchanged fields preserved

        // Verify persisted in database
        var persisted = await _context.Prayers.FindAsync(seeded.Id);
        persisted!.ScheduledTime.Should().Be(new TimeSpan(5, 30, 0));
        persisted.DurationMinutes.Should().Be(20);
        persisted.IsEnabled.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        var dto = new PrayerUpdateDto
        {
            ScheduledTime = "05:30",
            DurationMinutes = 20
        };

        // Act
        var result = await _sut.UpdateAsync(999, dto, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_ReturnsTrue()
    {
        // Arrange
        var seeded = await SeedPrayerAsync("Fajr", "\u0641\u062C\u0631", new TimeSpan(5, 0, 0));

        // Act
        var result = await _sut.DeleteAsync(seeded.Id, CancellationToken.None);

        // Assert
        result.Should().BeTrue();

        // Verify removed from database
        var persisted = await _context.Prayers.FindAsync(seeded.Id);
        persisted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_NonExistingId_ReturnsFalse()
    {
        // Act
        var result = await _sut.DeleteAsync(999, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
    }
}
