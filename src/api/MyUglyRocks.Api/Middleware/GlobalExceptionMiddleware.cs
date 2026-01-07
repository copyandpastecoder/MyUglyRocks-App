using System.Net;
using System.Text.Json;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Middleware;

/// <summary>
/// Global exception handling middleware that logs exceptions internally
/// but returns generic error messages to clients.
/// Prevents information disclosure through stack traces.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _environment;
    private readonly IErrorLogService _errorLogService;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment environment,
        IErrorLogService errorLogService)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
        _errorLogService = errorLogService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Generate correlation ID for tracking
        var correlationId = context.TraceIdentifier;

        // Log the full exception internally
        _logger.LogError(exception,
            "Unhandled exception occurred. CorrelationId: {CorrelationId}, Path: {Path}, Method: {Method}",
            correlationId, PiiMaskingHelper.SanitizeForLog(context.Request.Path), context.Request.Method);

        // Log to database (fire-and-forget, non-blocking)
        _ = Task.Run(async () =>
        {
            try
            {
                await _errorLogService.LogErrorAsync(context, exception, CancellationToken.None);
            }
            catch (Exception dbEx)
            {
                // Never fail request due to DB logging failure
                _logger.LogWarning(dbEx, "Failed to log error to database. CorrelationId: {CorrelationId}", correlationId);
            }
        });

        // Determine status code based on exception type
        var (statusCode, message) = exception switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, "Invalid request parameters."),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized access."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "The requested resource was not found."),
            InvalidOperationException => (HttpStatusCode.BadRequest, "Invalid operation."),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new ErrorResponse
        {
            Message = message,
            CorrelationId = correlationId
        };

        // Include details in development environment or for Admin users
        var isAdmin = context.User?.IsInRole("Admin") == true;
        if (_environment.IsDevelopment() || isAdmin)
        {
            response.Details = exception.Message;
            if (exception.InnerException != null)
            {
                response.Details += $" Inner: {exception.InnerException.Message}";
            }
        }

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }

    private class ErrorResponse
    {
        public string Message { get; set; } = string.Empty;
        public string CorrelationId { get; set; } = string.Empty;
        public string? Details { get; set; }
    }
}

/// <summary>
/// Extension method to register the middleware.
/// </summary>
public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<GlobalExceptionMiddleware>();
    }
}
