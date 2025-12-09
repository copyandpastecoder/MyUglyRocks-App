using System.IO.Compression;
using System.Text;
using System.Threading.RateLimiting;
using Amazon.S3;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Mappings;
using MyUglyRocks.Core.Services;
using MyUglyRocks.Infrastructure.Configuration;
using MyUglyRocks.Infrastructure.Data;
using MyUglyRocks.Infrastructure.Services;
using Resend;
using Scalar.AspNetCore;
using Serilog;
using StackExchange.Redis;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting MyUglyRocks API");

    var builder = WebApplication.CreateBuilder(args);

    // Configuration is loaded from environment variables (injected by K8s from secrets)
    // No external secrets provider needed - K8s handles secret injection

    // Configure Serilog
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    // Configure Mapster
    MappingConfig.Configure();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddOpenApi();

    // Configure PostgreSQL with EF Core
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Register DbContext as base type for services that depend on it
    builder.Services.AddScoped<DbContext>(provider => provider.GetRequiredService<AppDbContext>());

    // Configure JWT Authentication
    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("JWT Secret not configured");
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MyUglyRocks";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MyUglyRocks";

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

    // Configure Email Settings
    builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection(EmailSettings.SectionName));
    var emailApiKey = builder.Configuration["Email:ApiKey"] ?? "";
    builder.Services.AddOptions();
    builder.Services.AddHttpClient<ResendClient>();
    builder.Services.Configure<ResendClientOptions>(o => o.ApiToken = emailApiKey);
    builder.Services.AddTransient<IResend, ResendClient>();
    builder.Services.AddScoped<IEmailService, EmailService>();

    // Configure R2 Storage (required)
    builder.Services.Configure<R2Settings>(builder.Configuration.GetSection(R2Settings.SectionName));
    var r2Settings = builder.Configuration.GetSection(R2Settings.SectionName).Get<R2Settings>();
    if (r2Settings?.IsConfigured != true)
    {
        throw new InvalidOperationException("R2 storage configuration is required. Please configure R2 settings in appsettings.json or environment variables.");
    }
    builder.Services.AddSingleton<IAmazonS3>(sp =>
    {
        var config = new AmazonS3Config
        {
            ServiceURL = r2Settings.Endpoint,
            ForcePathStyle = true
        };
        return new AmazonS3Client(r2Settings.AccessKeyId, r2Settings.SecretAccessKey, config);
    });
    builder.Services.AddScoped<IStorageService, R2StorageService>();

    // Configure Hangfire for background jobs
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddHangfire(config => config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString)));
    builder.Services.AddHangfireServer();

    // Configure Redis caching
    var redisConnection = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "MyUglyRocks:";
    });

    // Register Redis connection for advanced operations (key pattern deletion)
    builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    {
        try
        {
            return ConnectionMultiplexer.Connect(redisConnection);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Redis connection failed, using null connection");
            return null!;
        }
    });

    builder.Services.AddScoped<ICacheService, RedisCacheService>();

    // Register application services
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<ITumblerService, TumblerService>();
    builder.Services.AddScoped<ICycleService, CycleService>();
    builder.Services.AddScoped<IReferenceDataService, ReferenceDataService>();
    builder.Services.AddScoped<IPostService, PostService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IExportService, ExportService>();
    builder.Services.AddScoped<IAdminService, AdminService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<SeedDataService>();

    // Configure CORS
    // Default origins + config-based origins
    var configOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    var defaultOrigins = new[] { "http://localhost:3000", "http://10.80.80.181:30000" };
    var allowedOrigins = configOrigins != null && configOrigins.Length > 0 ? configOrigins : defaultOrigins;
    Log.Information("Configured CORS origins: {Origins}", string.Join(", ", allowedOrigins));
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });

    // Configure response compression
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.Providers.Add<BrotliCompressionProvider>();
        options.Providers.Add<GzipCompressionProvider>();
        options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["application/json"]);
    });
    builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
    builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.SmallestSize);

    // Configure rate limiting
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        // Strict rate limit for authentication endpoints (login, register, password reset)
        options.AddFixedWindowLimiter("auth", limiterOptions =>
        {
            limiterOptions.PermitLimit = 5;
            limiterOptions.Window = TimeSpan.FromMinutes(1);
            limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            limiterOptions.QueueLimit = 0;
        });

        // Standard rate limit for general API endpoints
        options.AddSlidingWindowLimiter("api", limiterOptions =>
        {
            limiterOptions.PermitLimit = 100;
            limiterOptions.Window = TimeSpan.FromMinutes(1);
            limiterOptions.SegmentsPerWindow = 4;
            limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            limiterOptions.QueueLimit = 0;
        });
    });

    var app = builder.Build();

    // Configure the HTTP request pipeline
    app.UseResponseCompression();
    app.UseSerilogRequestLogging();

    // Security headers
    app.Use(async (context, next) =>
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("X-XSS-Protection", "0");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.Append("Permissions-Policy", "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");
        await next();
    });

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference(options =>
        {
            options.Title = "MyUglyRocks API";
            options.Theme = ScalarTheme.Purple;
        });

        // Hangfire Dashboard (only in development)
        app.MapHangfireDashboard("/hangfire");
    }

    // Only use HTTPS redirect in production
    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseCors("AllowFrontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // Health check endpoint
    app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
        .WithName("HealthCheck")
        .WithOpenApi();

    // Apply migrations and seed reference data on startup
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        var seeder = scope.ServiceProvider.GetRequiredService<SeedDataService>();
        await seeder.SeedAllAsync();
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
