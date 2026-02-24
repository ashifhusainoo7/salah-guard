using FluentValidation;
using SalahGuardApi.DTOs;

namespace SalahGuardApi.Validators;

/// <summary>
/// Validates prayer schedule update requests.
/// </summary>
public class PrayerUpdateValidator : AbstractValidator<PrayerUpdateDto>
{
    private static readonly HashSet<string> ValidDays = new(StringComparer.OrdinalIgnoreCase)
    {
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    };

    private static readonly HashSet<string> ValidPrayerNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jumuah"
    };

    public PrayerUpdateValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name!)
                .NotEmpty().WithMessage("Prayer name is required.")
                .MaximumLength(20).WithMessage("Prayer name must not exceed 20 characters.")
                .Must(name => ValidPrayerNames.Contains(name))
                .WithMessage("Prayer name must be one of: Fajr, Dhuhr, Asr, Maghrib, Isha, Jumuah.");
        });

        When(x => x.ScheduledTime is not null, () =>
        {
            RuleFor(x => x.ScheduledTime!)
                .NotEmpty().WithMessage("Scheduled time is required.")
                .Must(BeAValidTimeFormat).WithMessage("Scheduled time must be in HH:mm format.");
        });

        When(x => x.DurationMinutes.HasValue, () =>
        {
            RuleFor(x => x.DurationMinutes!.Value)
                .InclusiveBetween(5, 30).WithMessage("Duration must be between 5 and 30 minutes.");
        });

        When(x => x.ActiveDays is not null, () =>
        {
            RuleFor(x => x.ActiveDays!)
                .Must(days => days.All(d => ValidDays.Contains(d)))
                .WithMessage("Active days must contain valid day abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun).");
        });
    }

    private static bool BeAValidTimeFormat(string time)
    {
        return TimeSpan.TryParseExact(time, @"hh\:mm", null, out _);
    }
}
