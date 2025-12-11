namespace MyUglyRocks.Api.Middleware;

/// <summary>
/// CSRF protection middleware that validates Origin header for state-changing requests.
/// Since we use JWT + SameSite cookies, this provides defense-in-depth.
/// </summary>
public class CsrfProtectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CsrfProtectionMiddleware> _logger;
    private readonly HashSet<string> _allowedOrigins;
    private readonly HashSet<string> _safeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "GET", "HEAD", "OPTIONS", "TRACE"
    };

    public CsrfProtectionMiddleware(
        RequestDelegate next,
        ILogger<CsrfProtectionMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;

        // Load allowed origins from CORS configuration
        var corsOrigins = configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
        _allowedOrigins = new HashSet<string>(corsOrigins, StringComparer.OrdinalIgnoreCase);

        // Always allow same-origin requests (no Origin header)
        _logger.LogInformation("CSRF protection enabled for origins: {Origins}", string.Join(", ", _allowedOrigins));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Safe methods don't need CSRF protection
        if (_safeMethods.Contains(context.Request.Method))
        {
            await _next(context);
            return;
        }

        // State-changing methods (POST, PUT, DELETE, PATCH) need validation
        var origin = context.Request.Headers.Origin.FirstOrDefault();
        var referer = context.Request.Headers.Referer.FirstOrDefault();

        // If there's an Origin header, validate it
        if (!string.IsNullOrEmpty(origin))
        {
            if (!IsOriginAllowed(origin))
            {
                _logger.LogWarning(
                    "CSRF: Blocked request from disallowed origin. Method={Method}, Path={Path}, Origin={Origin}, IP={IP}",
                    context.Request.Method,
                    context.Request.Path,
                    origin,
                    context.Connection.RemoteIpAddress);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid origin" });
                return;
            }
        }
        // No Origin header - check Referer for additional protection
        else if (!string.IsNullOrEmpty(referer))
        {
            if (!IsRefererAllowed(referer))
            {
                _logger.LogWarning(
                    "CSRF: Blocked request from disallowed referer. Method={Method}, Path={Path}, Referer={Referer}, IP={IP}",
                    context.Request.Method,
                    context.Request.Path,
                    referer,
                    context.Connection.RemoteIpAddress);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid referer" });
                return;
            }
        }
        // For API requests without Origin/Referer (e.g., from mobile apps or tools),
        // we rely on JWT authentication and SameSite cookies for protection

        await _next(context);
    }

    private bool IsOriginAllowed(string origin)
    {
        // Check if origin is in the allowed list
        return _allowedOrigins.Contains(origin);
    }

    private bool IsRefererAllowed(string referer)
    {
        // Extract origin from referer URL
        if (Uri.TryCreate(referer, UriKind.Absolute, out var uri))
        {
            var refererOrigin = $"{uri.Scheme}://{uri.Authority}";
            return _allowedOrigins.Contains(refererOrigin);
        }
        return false;
    }
}

public static class CsrfProtectionMiddlewareExtensions
{
    public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CsrfProtectionMiddleware>();
    }
}
