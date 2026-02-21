using FluentValidation;
using SalahGuardApi.DTOs;

namespace SalahGuardApi.Validators;

/// <summary>
/// Validates settings update requests (all boolean fields are inherently valid).
/// </summary>
public class SettingsValidator : AbstractValidator<SettingsDto>
{
    public SettingsValidator()
    {
        // All fields are boolean and do not require validation beyond type checking,
        // which is handled by model binding. This validator exists for consistency
        // and can be extended if settings fields evolve.
    }
}
