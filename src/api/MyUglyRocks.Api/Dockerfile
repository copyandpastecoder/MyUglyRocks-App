# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy all project files first (for better layer caching)
COPY ["src/api/MyUglyRocks.Api/MyUglyRocks.Api.csproj", "src/api/MyUglyRocks.Api/"]
COPY ["src/api/MyUglyRocks.Core/MyUglyRocks.Core.csproj", "src/api/MyUglyRocks.Core/"]
COPY ["src/api/MyUglyRocks.Infrastructure/MyUglyRocks.Infrastructure.csproj", "src/api/MyUglyRocks.Infrastructure/"]
COPY ["src/api/MyUglyRocks.Abstractions/MyUglyRocks.Abstractions.csproj", "src/api/MyUglyRocks.Abstractions/"]

# Restore dependencies
RUN dotnet restore "src/api/MyUglyRocks.Api/MyUglyRocks.Api.csproj"

# Copy source code and seed data
COPY src/api/ src/api/
COPY docs/seed-data/ docs/seed-data/

# Build and publish
WORKDIR /src/src/api/MyUglyRocks.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install PostgreSQL client tools for database backup/restore
# Required for pg_dump and pg_restore commands used by DatabaseBackupService
# Install PostgreSQL 17 client to match Railway's PostgreSQL version
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget gnupg ca-certificates && \
    mkdir -p /usr/share/keyrings && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client-17 && \
    rm -rf /var/lib/apt/lists/*

# Copy published app
COPY --from=build /app/publish .

# Copy seed data files
COPY --from=build /src/docs/seed-data /docs/seed-data

# Expose port
EXPOSE 8080

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "MyUglyRocks.Api.dll"]
