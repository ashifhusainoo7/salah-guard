using FluentValidation;
using SalahGuardApi.DTOs;

namespace SalahGuardApi.Validators;

/// <summary>
/// Validates DND session creation requests.
/// </summary>
public class DndSessionCreateValidator : AbstractValidator<DndSessionCreateDto>
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Completed", "Interrupted"
    };

    private static readonly HashSet<string> ValidPrayerNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jumuah"
    };

    public DndSessionCreateValidator()
    {
        RuleFor(x => x.PrayerName)
            .NotEmpty().WithMessage("Prayer name is required.")
            .Must(name => ValidPrayerNames.Contains(name))
            .WithMessage("Prayer name must be one of: Fajr, Dhuhr, Asr, Maghrib, Isha, Jumuah.");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Start time is required.")
            .Must(BeAValidDateTime).WithMessage("Start time must be a valid ISO 8601 datetime.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("End time is required.")
            .Must(BeAValidDateTime).WithMessage("End time must be a valid ISO 8601 datetime.");

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(1, 60).WithMessage("Duration must be between 1 and 60 minutes.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.")
            .Must(status => ValidStatuses.Contains(status))
            .WithMessage("Status must be 'Completed' or 'Interrupted'.");
    }

    private static bool BeAValidDateTime(string dateTime)
    {
        return DateTime.TryParse(dateTime, out _);
    }
}
