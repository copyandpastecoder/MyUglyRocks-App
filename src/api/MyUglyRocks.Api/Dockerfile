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
