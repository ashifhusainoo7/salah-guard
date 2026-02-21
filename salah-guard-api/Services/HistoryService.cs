using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SalahGuardApi.Data;
using SalahGuardApi.DTOs;

namespace SalahGuardApi.Services;

/// <summary>
/// Service implementation for DND session history operations.
/// </summary>
public class HistoryService : IHistoryService
{
    private readonly SalahGuardDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<HistoryService> _logger;

    public HistoryService(SalahGuardDbContext context, IMapper mapper, ILogger<HistoryService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<PaginatedResponse<DndSessionDto>> GetHistoryAsync(
        int page, int pageSize, string? prayerName, CancellationToken cancellationToken)
    {
        var query = _context.DndSessions.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(prayerName))
        {
            query = query.Where(s => s.PrayerName == prayerName);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(s => s.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedResponse<DndSessionDto>
        {
            Items = _mapper.Map<List<DndSessionDto>>(items),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    /// <inheritdoc />
    public async Task<DndSessionDto> CreateSessionAsync(DndSessionCreateDto dto, CancellationToken cancellationToken)
    {
        var session = _mapper.Map<Models.DndSession>(dto);
        _context.DndSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Logged DND session for {PrayerName}: {Status}", session.PrayerName, session.Status);
        return _mapper.Map<DndSessionDto>(session);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var session = await _context.DndSessions.FindAsync(new object[] { id }, cancellationToken);
        if (session is null)
        {
            return false;
        }

        _context.DndSessions.Remove(session);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted DND session (ID: {SessionId})", id);
        return true;
    }
}
