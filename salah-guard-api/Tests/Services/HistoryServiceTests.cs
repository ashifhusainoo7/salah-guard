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

public class HistoryServiceTests : IDisposable
{
    private readonly SalahGuardDbContext _context;
    private readonly IMapper _mapper;
    private readonly HistoryService _sut;

    public HistoryServiceTests()
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

        var logger = new Mock<ILogger<HistoryService>>();

        _sut = new HistoryService(_context, _mapper, logger.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private async Task SeedSessionsAsync(int count, string prayerName = "Fajr")
    {
        for (int i = 0; i < count; i++)
        {
            var startTime = DateTime.UtcNow.AddDays(-i);
            _context.DndSessions.Add(new DndSession
            {
                PrayerName = prayerName,
                StartTime = startTime,
                EndTime = startTime.AddMinutes(15),
                DurationMinutes = 15,
                Status = "Completed"
            });
        }

        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task GetHistoryAsync_ReturnsPagedResults()
    {
        // Arrange - seed 25 sessions total
        await SeedSessionsAsync(25, "Fajr");

        // Act - request page 1 with page size 10
        var result = await _sut.GetHistoryAsync(1, 10, null, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(10);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalCount.Should().Be(25);
        result.TotalPages.Should().Be(3);

        // Verify items are ordered by StartTime descending (most recent first)
        for (int i = 0; i < result.Items.Count - 1; i++)
        {
            DateTime.Parse(result.Items[i].StartTime)
                .Should().BeOnOrAfter(DateTime.Parse(result.Items[i + 1].StartTime));
        }
    }

    [Fact]
    public async Task GetHistoryAsync_WithPrayerNameFilter_ReturnsFiltered()
    {
        // Arrange - seed sessions for different prayers
        await SeedSessionsAsync(5, "Fajr");
        await SeedSessionsAsync(3, "Dhuhr");
        await SeedSessionsAsync(7, "Asr");

        // Act - filter by "Dhuhr"
        var result = await _sut.GetHistoryAsync(1, 20, "Dhuhr", CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(3);
        result.TotalCount.Should().Be(3);
        result.TotalPages.Should().Be(1);
        result.Items.Should().AllSatisfy(item =>
        {
            item.PrayerName.Should().Be("Dhuhr");
        });
    }

    [Fact]
    public async Task CreateSessionAsync_ValidDto_CreatesSession()
    {
        // Arrange
        var startTime = DateTime.UtcNow;
        var endTime = startTime.AddMinutes(15);

        var dto = new DndSessionCreateDto
        {
            PrayerName = "Maghrib",
            StartTime = startTime.ToString("o"),
            EndTime = endTime.ToString("o"),
            DurationMinutes = 15,
            Status = "Completed"
        };

        // Act
        var result = await _sut.CreateSessionAsync(dto, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.PrayerName.Should().Be("Maghrib");
        result.DurationMinutes.Should().Be(15);
        result.Status.Should().Be("Completed");

        // Verify persisted in database
        var persisted = await _context.DndSessions.FirstOrDefaultAsync(s => s.PrayerName == "Maghrib");
        persisted.Should().NotBeNull();
        persisted!.DurationMinutes.Should().Be(15);
        persisted.Status.Should().Be("Completed");
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_ReturnsTrue()
    {
        // Arrange
        var session = new DndSession
        {
            PrayerName = "Isha",
            StartTime = DateTime.UtcNow,
            EndTime = DateTime.UtcNow.AddMinutes(25),
            DurationMinutes = 25,
            Status = "Completed"
        };
        _context.DndSessions.Add(session);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.DeleteAsync(session.Id, CancellationToken.None);

        // Assert
        result.Should().BeTrue();

        // Verify removed from database
        var persisted = await _context.DndSessions.FindAsync(session.Id);
        persisted.Should().BeNull();
    }
}
