using FluentAssertions;
using FluentValidation.TestHelper;
using SalahGuardApi.DTOs;
using SalahGuardApi.Validators;

namespace SalahGuardApi.Tests.Validators;

public class PrayerUpdateValidatorTests
{
    private readonly PrayerUpdateValidator _validator;

    public PrayerUpdateValidatorTests()
    {
        _validator = new PrayerUpdateValidator();
    }

    [Fact]
    public void ValidDto_PassesValidation()
    {
        // Arrange
        var dto = new PrayerUpdateDto
        {
            Name = "Fajr",
            ScheduledTime = "05:00",
            DurationMinutes = 15,
            IsEnabled = true,
            ActiveDays = new List<string> { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" }
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(4)]
    [InlineData(3)]
    [InlineData(1)]
    [InlineData(0)]
    [InlineData(-1)]
    public void InvalidDuration_LessThan5_FailsValidation(int duration)
    {
        // Arrange
        var dto = new PrayerUpdateDto
        {
            DurationMinutes = duration
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.DurationMinutes!.Value)
            .WithErrorMessage("Duration must be between 5 and 30 minutes.");
    }

    [Theory]
    [InlineData(31)]
    [InlineData(45)]
    [InlineData(60)]
    [InlineData(100)]
    public void InvalidDuration_GreaterThan30_FailsValidation(int duration)
    {
        // Arrange
        var dto = new PrayerUpdateDto
        {
            DurationMinutes = duration
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.DurationMinutes!.Value)
            .WithErrorMessage("Duration must be between 5 and 30 minutes.");
    }

    [Theory]
    [InlineData("5:00")]      // missing leading zero
    [InlineData("25:00")]     // invalid hour
    [InlineData("12:60")]     // invalid minute
    [InlineData("abc")]       // non-numeric
    [InlineData("12-30")]     // wrong separator
    [InlineData("1200")]      // no separator
    [InlineData("")]          // empty string
    public void InvalidTimeFormat_FailsValidation(string time)
    {
        // Arrange
        var dto = new PrayerUpdateDto
        {
            ScheduledTime = time
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.ErrorMessage.Contains("HH:mm") || e.ErrorMessage.Contains("required"));
    }

    [Theory]
    [InlineData("Monday")]
    [InlineData("Tues")]
    [InlineData("mo")]
    [InlineData("INVALID")]
    [InlineData("")]
    public void InvalidDayName_FailsValidation(string invalidDay)
    {
        // Arrange
        var dto = new PrayerUpdateDto
        {
            ActiveDays = new List<string> { "Mon", invalidDay, "Wed" }
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ShouldHaveValidationErrorFor(x => x.ActiveDays!)
            .WithErrorMessage("Active days must contain valid day abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun).");
    }

    [Fact]
    public void NullFields_PassesValidation_WhenAllOptional()
    {
        // Arrange - all fields null means no validation rules apply
        var dto = new PrayerUpdateDto();

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("Fajr")]
    [InlineData("Dhuhr")]
    [InlineData("Asr")]
    [InlineData("Maghrib")]
    [InlineData("Isha")]
    public void ValidPrayerNames_PassValidation(string name)
    {
        // Arrange
        var dto = new PrayerUpdateDto { Name = name };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData("InvalidPrayer")]
    [InlineData("Zuhr")]
    [InlineData("Tahajjud")]
    public void InvalidPrayerNames_FailValidation(string name)
    {
        // Arrange
        var dto = new PrayerUpdateDto { Name = name };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name!)
            .WithErrorMessage("Prayer name must be one of: Fajr, Dhuhr, Asr, Maghrib, Isha.");
    }

    [Theory]
    [InlineData(5)]
    [InlineData(15)]
    [InlineData(30)]
    public void ValidDuration_PassesValidation(int duration)
    {
        // Arrange
        var dto = new PrayerUpdateDto { DurationMinutes = duration };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.DurationMinutes!.Value);
    }

    [Theory]
    [InlineData("00:00")]
    [InlineData("05:30")]
    [InlineData("12:00")]
    [InlineData("23:59")]
    public void ValidTimeFormats_PassValidation(string time)
    {
        // Arrange
        var dto = new PrayerUpdateDto { ScheduledTime = time };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.ScheduledTime);
    }
}
