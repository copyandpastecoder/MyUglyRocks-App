namespace MyUglyRocks.Abstractions.DTOs;

/// <summary>
/// Request DTO for logging client-side errors from the UI
/// </summary>
public record ClientErrorRequest(
    /// <summary>
    /// Error message
    /// </summary>
    string Message,

    /// <summary>
    /// JavaScript stack trace
    /// </summary>
    string? StackTrace,

    /// <summary>
    /// Error type (TypeError, ReferenceError, etc.)
    /// </summary>
    string ExceptionType,

    /// <summary>
    /// React component stack (for React errors)
    /// </summary>
    string? ComponentStack,

    /// <summary>
    /// URL where error occurred
    /// </summary>
    string Url,

    /// <summary>
    /// Browser user agent
    /// </summary>
    string UserAgent,

    /// <summary>
    /// User ID if logged in (extracted from JWT on client)
    /// </summary>
    string? UserId
);
