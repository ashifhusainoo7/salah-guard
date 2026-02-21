# Multi-stage Dockerfile for Salah Guard API
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["salah-guard-api.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create non-root user
RUN groupadd -r salahguard && useradd -r -g salahguard -d /app salahguard

# Create data directory for SQLite
RUN mkdir -p /app/data /app/logs && chown -R salahguard:salahguard /app

COPY --from=build /app/publish .
RUN chown -R salahguard:salahguard /app

# Switch to non-root user
USER salahguard

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/salahguard.db"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "salah-guard-api.dll"]
