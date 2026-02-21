using Microsoft.EntityFrameworkCore;
using SalahGuardApi.Models;

namespace SalahGuardApi.Data;

/// <summary>
/// Entity Framework Core database context for the Salah Guard application.
/// </summary>
public class SalahGuardDbContext : DbContext
{
    public SalahGuardDbContext(DbContextOptions<SalahGuardDbContext> options)
        : base(options)
    {
    }

    public DbSet<Prayer> Prayers => Set<Prayer>();
    public DbSet<DndSession> DndSessions => Set<DndSession>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Prayer>(entity =>
        {
            entity.HasIndex(p => p.Name).IsUnique();
            entity.Property(p => p.Name).IsRequired().HasMaxLength(20);
            entity.Property(p => p.ArabicName).IsRequired().HasMaxLength(20);
            entity.Property(p => p.ActiveDays).IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<DndSession>(entity =>
        {
            entity.HasIndex(d => d.PrayerName);
            entity.HasIndex(d => d.StartTime);
            entity.HasIndex(d => new { d.PrayerName, d.StartTime });
            entity.Property(d => d.PrayerName).IsRequired().HasMaxLength(20);
            entity.Property(d => d.Status).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(r => r.TokenHash).IsUnique();
            entity.HasIndex(r => r.DeviceId);
            entity.Property(r => r.TokenHash).IsRequired().HasMaxLength(512);
            entity.Property(r => r.DeviceId).IsRequired().HasMaxLength(100);
        });
    }
}
