using FluentValidation;
using SalahGuardApi.DTOs;

namespace SalahGuardApi.Validators;

/// <summary>
/// Validates device registration requests.
/// </summary>
public class DeviceRegisterValidator : AbstractValidator<DeviceRegisterDto>
{
    public DeviceRegisterValidator()
    {
        RuleFor(x => x.DeviceId)
            .NotEmpty().WithMessage("Device ID is required.")
            .MaximumLength(100).WithMessage("Device ID must not exceed 100 characters.")
            .Matches(@"^[a-zA-Z0-9\-_]+$").WithMessage("Device ID contains invalid characters.");
    }
}
