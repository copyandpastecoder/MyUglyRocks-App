namespace MyUglyRocks.Abstractions.DTOs;

/// <summary>
/// Lightweight error log DTO for list views
/// </summary>
public record ErrorLogListDto(
    Guid ErrorLogId,
    string CorrelationId,
    string ExceptionType,
    string MessageExcerpt,  // Truncated message for display
    string Severity,         // "Info", "Warning", "Error", "Critical"
    string? HttpMethod,
    string? HttpPath,
    int? HttpStatusCode,
    string? Username,
    DateTime DateCreated
);

/// <summary>
/// Detailed error log DTO for detail views
/// </summary>
public record ErrorLogDetailDto(
    Guid ErrorLogId,
    string CorrelationId,
    string ExceptionType,
    string Message,          // Full message
    string? StackTrace,
    string Severity,
    string? HttpMethod,
    string? HttpPath,
    string? HttpQueryString,
    int? HttpStatusCode,
    Guid? UserId,
    string? Username,
    string? IpAddress,
    string? UserAgent,
    Dictionary<string, string>? RequestHeaders,  // Deserialized from JSON
    string? InnerException,
    DateTime DateCreated
);
