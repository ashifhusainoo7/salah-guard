using System.Text.Json;
using AutoMapper;
using SalahGuardApi.DTOs;
using SalahGuardApi.Models;

namespace SalahGuardApi.Mapping;

/// <summary>
/// AutoMapper profile for mapping between domain models and DTOs.
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Prayer, PrayerDto>()
            .ForMember(dest => dest.ScheduledTime,
                opt => opt.MapFrom(src => src.ScheduledTime.ToString(@"hh\:mm")))
            .ForMember(dest => dest.ActiveDays,
                opt => opt.MapFrom(src => JsonSerializer.Deserialize<List<string>>(src.ActiveDays, (JsonSerializerOptions?)null) ?? new List<string>()));

        CreateMap<DndSession, DndSessionDto>()
            .ForMember(dest => dest.StartTime,
                opt => opt.MapFrom(src => src.StartTime.ToString("o")))
            .ForMember(dest => dest.EndTime,
                opt => opt.MapFrom(src => src.EndTime.ToString("o")));

        CreateMap<DndSessionCreateDto, DndSession>()
            .ForMember(dest => dest.StartTime,
                opt => opt.MapFrom(src => DateTime.Parse(src.StartTime).ToUniversalTime()))
            .ForMember(dest => dest.EndTime,
                opt => opt.MapFrom(src => DateTime.Parse(src.EndTime).ToUniversalTime()));

        CreateMap<UserSettings, SettingsDto>().ReverseMap();
    }
}
