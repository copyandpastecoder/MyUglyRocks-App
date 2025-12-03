# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy all project files first (for better layer caching)
COPY ["MyUglyRocks.Api/MyUglyRocks.Api.csproj", "MyUglyRocks.Api/"]
COPY ["MyUglyRocks.Core/MyUglyRocks.Core.csproj", "MyUglyRocks.Core/"]
COPY ["MyUglyRocks.Infrastructure/MyUglyRocks.Infrastructure.csproj", "MyUglyRocks.Infrastructure/"]
COPY ["MyUglyRocks.Abstractions/MyUglyRocks.Abstractions.csproj", "MyUglyRocks.Abstractions/"]

# Restore dependencies
RUN dotnet restore "MyUglyRocks.Api/MyUglyRocks.Api.csproj"

# Copy everything else
COPY . .

# Build and publish
WORKDIR /src/MyUglyRocks.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install curl for downloading Akeyless CLI
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Akeyless CLI to expected location and pre-configure to skip first-time wizard
RUN mkdir -p /root/.akeyless/bin /root/.akeyless/profiles \
    && curl -o /root/.akeyless/bin/akeyless https://akeyless-cli.s3.us-east-2.amazonaws.com/cli/latest/production/cli-linux-amd64 \
    && chmod +x /root/.akeyless/bin/akeyless \
    && ln -s /root/.akeyless/bin/akeyless /usr/local/bin/akeyless \
    && printf 'access_type = "access_key"\n' > /root/.akeyless/profiles/default.toml

# Add CLI to PATH
ENV PATH="/root/.akeyless/bin:${PATH}"

# Copy published app
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "MyUglyRocks.Api.dll"]
