using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Represents an error/exception logged from the API for debugging and monitoring
/// </summary>
public class ErrorLog : BaseEntity
{
    public Guid ErrorLogId { get; set; }

    /// <summary>
    /// HTTP TraceIdentifier for correlating with request logs
    /// </summary>
    public required string CorrelationId { get; set; }

    /// <summary>
    /// Full exception type name (e.g., "System.ArgumentException")
    /// </summary>
    public required string ExceptionType { get; set; }

    /// <summary>
    /// Exception message (PII-masked where appropriate)
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Full stack trace for debugging (truncated to 10,000 chars)
    /// </summary>
    public string? StackTrace { get; set; }

    /// <summary>
    /// Error severity level for filtering and prioritization
    /// </summary>
    public ErrorSeverity Severity { get; set; } = ErrorSeverity.Error;

    /// <summary>
    /// HTTP method (GET, POST, PUT, DELETE, etc.)
    /// </summary>
    public string? HttpMethod { get; set; }

    /// <summary>
    /// Request path (sanitized to prevent log injection)
    /// </summary>
    public string? HttpPath { get; set; }

    /// <summary>
    /// Query string parameters (sanitized)
    /// </summary>
    public string? HttpQueryString { get; set; }

    /// <summary>
    /// HTTP status code returned (400, 401, 404, 500, etc.)
    /// </summary>
    public int? HttpStatusCode { get; set; }

    /// <summary>
    /// User who triggered the error (null if not authenticated)
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Client IP address (masked for privacy: 192.168.x.x)
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent string (browser/client info, truncated to 512 chars)
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Selected request headers as JSON (User-Agent, Referer, Accept, Origin)
    /// Excludes sensitive headers (Authorization, Cookie)
    /// </summary>
    public string? RequestHeaders { get; set; }

    /// <summary>
    /// Inner exception message and type (if present)
    /// </summary>
    public string? InnerException { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
}
