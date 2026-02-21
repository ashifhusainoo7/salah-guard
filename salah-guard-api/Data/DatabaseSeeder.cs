using Microsoft.EntityFrameworkCore;
using SalahGuardApi.Models;

namespace SalahGuardApi.Data;

/// <summary>
/// Seeds the database with default prayer schedules and settings on first run.
/// </summary>
public static class DatabaseSeeder
{
    /// <summary>
    /// Seeds default data if the database is empty.
    /// </summary>
    public static async Task SeedAsync(SalahGuardDbContext context, CancellationToken cancellationToken = default)
    {
        await context.Database.EnsureCreatedAsync(cancellationToken);

        if (!await context.Prayers.AnyAsync(cancellationToken))
        {
            var defaultDays = "[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\",\"Sun\"]";

            var prayers = new List<Prayer>
            {
                new()
                {
                    Name = "Fajr",
                    ArabicName = "فجر",
                    ScheduledTime = new TimeSpan(5, 0, 0),
                    DurationMinutes = 15,
                    IsEnabled = true,
                    ActiveDays = defaultDays
                },
                new()
                {
                    Name = "Dhuhr",
                    ArabicName = "ظهر",
                    ScheduledTime = new TimeSpan(13, 0, 0),
                    DurationMinutes = 20,
                    IsEnabled = true,
                    ActiveDays = defaultDays
                },
                new()
                {
                    Name = "Asr",
                    ArabicName = "عصر",
                    ScheduledTime = new TimeSpan(16, 30, 0),
                    DurationMinutes = 15,
                    IsEnabled = true,
                    ActiveDays = defaultDays
                },
                new()
                {
                    Name = "Maghrib",
                    ArabicName = "مغرب",
                    ScheduledTime = new TimeSpan(19, 0, 0),
                    DurationMinutes = 15,
                    IsEnabled = true,
                    ActiveDays = defaultDays
                },
                new()
                {
                    Name = "Isha",
                    ArabicName = "عشاء",
                    ScheduledTime = new TimeSpan(21, 0, 0),
                    DurationMinutes = 25,
                    IsEnabled = true,
                    ActiveDays = defaultDays
                }
            };

            await context.Prayers.AddRangeAsync(prayers, cancellationToken);
        }

        if (!await context.UserSettings.AnyAsync(cancellationToken))
        {
            await context.UserSettings.AddAsync(new UserSettings
            {
                IsGloballyActive = true,
                SilentNotificationOnStart = true,
                ShowLiftedNotification = true,
                DarkMode = false
            }, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
