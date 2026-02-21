using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalahGuardApi.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Prayers",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                Name = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                ArabicName = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                ScheduledTime = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                DurationMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                ActiveDays = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Prayers", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "DndSessions",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                PrayerName = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                StartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                EndTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                DurationMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DndSessions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "UserSettings",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                IsGloballyActive = table.Column<bool>(type: "INTEGER", nullable: false),
                SilentNotificationOnStart = table.Column<bool>(type: "INTEGER", nullable: false),
                ShowLiftedNotification = table.Column<bool>(type: "INTEGER", nullable: false),
                DarkMode = table.Column<bool>(type: "INTEGER", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserSettings", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "RefreshTokens",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                TokenHash = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                DeviceId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                IsRevoked = table.Column<bool>(type: "INTEGER", nullable: false),
                RevokedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RefreshTokens", x => x.Id);
            });

        // Indexes
        migrationBuilder.CreateIndex(
            name: "IX_Prayers_Name",
            table: "Prayers",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_DndSessions_PrayerName",
            table: "DndSessions",
            column: "PrayerName");

        migrationBuilder.CreateIndex(
            name: "IX_DndSessions_StartTime",
            table: "DndSessions",
            column: "StartTime");

        migrationBuilder.CreateIndex(
            name: "IX_DndSessions_PrayerName_StartTime",
            table: "DndSessions",
            columns: new[] { "PrayerName", "StartTime" });

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_TokenHash",
            table: "RefreshTokens",
            column: "TokenHash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_DeviceId",
            table: "RefreshTokens",
            column: "DeviceId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "RefreshTokens");
        migrationBuilder.DropTable(name: "UserSettings");
        migrationBuilder.DropTable(name: "DndSessions");
        migrationBuilder.DropTable(name: "Prayers");
    }
}
