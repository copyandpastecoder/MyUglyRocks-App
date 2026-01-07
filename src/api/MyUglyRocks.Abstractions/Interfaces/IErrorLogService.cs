using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

/// <summary>
/// Severity level for error categorization and filtering
/// </summary>
public enum ErrorSeverity
{
    /// <summary>
    /// Informational errors (404 Not Found)
    /// </summary>
    Info = 0,

    /// <summary>
    /// Warning-level errors (401 Unauthorized, 403 Forbidden)
    /// </summary>
    Warning = 1,

    /// <summary>
    /// Standard errors (400 Bad Request, ArgumentException, InvalidOperationException)
    /// </summary>
    Error = 2,

    /// <summary>
    /// Critical errors (500 Internal Server Error, unhandled exceptions)
    /// </summary>
    Critical = 3
}

/// <summary>
/// Service for logging and querying API errors/exceptions
/// </summary>
public interface IErrorLogService
{
    /// <summary>
    /// Log an exception to the database with HTTP context details
    /// Note: This method is called from middleware, so HttpContext is passed as dynamic to avoid AspNetCore dependency in Abstractions
    /// </summary>
    /// <param name="context">HTTP context with request details (Microsoft.AspNetCore.Http.HttpContext)</param>
    /// <param name="exception">Exception to log</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task LogErrorAsync(dynamic context, Exception exception, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get error logs with filtering and pagination
    /// </summary>
    /// <param name="startDate">Filter by errors after this date</param>
    /// <param name="endDate">Filter by errors before this date</param>
    /// <param name="severity">Filter by severity level</param>
    /// <param name="userId">Filter by user ID</param>
    /// <param name="searchPath">Search by HTTP path</param>
    /// <param name="searchCorrelationId">Search by correlation ID</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of error logs</returns>
    Task<PaginatedResult<ErrorLogListDto>> GetErrorLogsAsync(
        DateTime? startDate,
        DateTime? endDate,
        ErrorSeverity? severity,
        Guid? userId,
        string? searchPath,
        string? searchCorrelationId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get detailed error log by ID
    /// </summary>
    /// <param name="errorLogId">Error log ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Error log detail or null if not found</returns>
    Task<ErrorLogDetailDto?> GetErrorLogByIdAsync(Guid errorLogId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete error logs older than the specified retention period
    /// </summary>
    /// <param name="retentionDays">Number of days to retain logs</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of records deleted</returns>
    Task<int> DeleteOldErrorLogsAsync(int retentionDays, CancellationToken cancellationToken = default);
}
