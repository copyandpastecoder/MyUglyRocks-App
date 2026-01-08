using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class ErrorLogService : IErrorLogService
{
    private readonly DbContext _context;
    private readonly ILogger<ErrorLogService> _logger;
    private const int MaxStackTraceLength = 10000;

    public ErrorLogService(
        DbContext context,
        ILogger<ErrorLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogErrorAsync(dynamic context, Exception exception, CancellationToken cancellationToken = default)
    {
        try
        {
            // Extract user ID from claims
            Guid? userId = null;
            var userIdClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? context.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                if (Guid.TryParse(userIdClaim, out Guid parsedUserId))
                {
                    userId = parsedUserId;
                }
            }

            // Determine HTTP status code and severity
            var statusCode = context.Response?.StatusCode ?? 500;
            var severity = MapStatusCodeToSeverity(statusCode, exception);

            // Extract and mask IP address
            var ipAddress = context.Connection?.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = PiiMaskingHelper.MaskIpAddress(ipAddress);
            }

            // Sanitize request path and query string
            var path = context.Request?.Path.ToString();
            if (!string.IsNullOrEmpty(path))
            {
                path = PiiMaskingHelper.SanitizeForLog(path);
            }

            var queryString = context.Request?.QueryString.ToString();
            if (!string.IsNullOrEmpty(queryString))
            {
                queryString = PiiMaskingHelper.SanitizeForLog(queryString);
            }

            // Extract selected headers (exclude sensitive ones)
            string? headersJson = null;
            if (context.Request?.Headers != null)
            {
                var selectedHeaders = new Dictionary<string, string>();
                foreach (var header in new[] { "User-Agent", "Referer", "Accept", "Origin" })
                {
                    if (context.Request.Headers.TryGetValue(header, out dynamic value))
                    {
                        selectedHeaders[header] = value.ToString();
                    }
                }

                if (selectedHeaders.Count > 0)
                {
                    headersJson = JsonSerializer.Serialize(selectedHeaders);
                }
            }

            // Truncate stack trace if too long
            var stackTrace = exception.StackTrace;
            if (!string.IsNullOrEmpty(stackTrace) && stackTrace.Length > MaxStackTraceLength)
            {
                stackTrace = stackTrace.Substring(0, MaxStackTraceLength) + "\n... (truncated)";
            }

            // Extract inner exception if present
            string? innerException = null;
            if (exception.InnerException != null)
            {
                innerException = $"{exception.InnerException.GetType().FullName}: {exception.InnerException.Message}";
            }

            var errorLog = new ErrorLog
            {
                CorrelationId = context.TraceIdentifier,
                ExceptionType = exception.GetType().FullName ?? exception.GetType().Name,
                Message = exception.Message,
                StackTrace = stackTrace,
                Severity = severity,
                HttpMethod = context.Request?.Method,
                HttpPath = path,
                HttpQueryString = queryString,
                HttpStatusCode = statusCode,
                UserId = userId,
                IpAddress = ipAddress,
                UserAgent = context.Request?.Headers.TryGetValue("User-Agent", out Microsoft.Extensions.Primitives.StringValues userAgentValue) == true && !string.IsNullOrEmpty(userAgentValue.ToString())
                    ? userAgentValue.ToString().Substring(0, Math.Min(512, userAgentValue.ToString().Length))
                    : null,
                RequestHeaders = headersJson,
                InnerException = innerException
            };

            _context.Set<ErrorLog>().Add(errorLog);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Log failure to Serilog but don't throw (fire-and-forget pattern)
            _logger.LogWarning(ex, "Failed to log error to database");
        }
    }

    public async Task<PaginatedResult<ErrorLogListDto>> GetErrorLogsAsync(
        DateTime? startDate,
        DateTime? endDate,
        ErrorSeverity? severity,
        Guid? userId,
        string? searchPath,
        string? searchCorrelationId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        // Clamp pagination parameters
        var skip = PaginationHelper.ClampSkip((page - 1) * pageSize);
        var take = PaginationHelper.ClampTake(pageSize);

        var query = _context.Set<ErrorLog>()
            .Include(e => e.User)
            .AsQueryable();

        // Apply filters
        if (startDate.HasValue)
        {
            query = query.Where(e => e.DateCreated >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.DateCreated <= endDate.Value);
        }

        if (severity.HasValue)
        {
            query = query.Where(e => e.Severity == severity.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(e => e.UserId == userId.Value);
        }

        if (!string.IsNullOrEmpty(searchPath))
        {
            query = query.Where(e => e.HttpPath != null && e.HttpPath.Contains(searchPath));
        }

        if (!string.IsNullOrEmpty(searchCorrelationId))
        {
            query = query.Where(e => e.CorrelationId.Contains(searchCorrelationId));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var errors = await query
            .OrderByDescending(e => e.DateCreated)
            .Skip(skip)
            .Take(take)
            .Select(e => new ErrorLogListDto(
                e.ErrorLogId,
                e.CorrelationId,
                e.ExceptionType,
                e.Message.Length > 200 ? e.Message.Substring(0, 200) + "..." : e.Message, // Truncate for list view
                e.Severity.ToString(),
                e.HttpMethod,
                e.HttpPath,
                e.HttpStatusCode,
                e.User != null ? e.User.Username : null,
                e.DateCreated
            ))
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling(totalCount / (double)take);

        return new PaginatedResult<ErrorLogListDto>(errors, totalCount, page, take, totalPages);
    }

    public async Task<ErrorLogDetailDto?> GetErrorLogByIdAsync(Guid errorLogId, CancellationToken cancellationToken = default)
    {
        var errorLog = await _context.Set<ErrorLog>()
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.ErrorLogId == errorLogId, cancellationToken);

        if (errorLog == null)
        {
            return null;
        }

        // Deserialize headers JSON
        Dictionary<string, string>? headers = null;
        if (!string.IsNullOrEmpty(errorLog.RequestHeaders))
        {
            try
            {
                headers = JsonSerializer.Deserialize<Dictionary<string, string>>(errorLog.RequestHeaders);
            }
            catch
            {
                // Ignore deserialization errors
            }
        }

        return new ErrorLogDetailDto(
            errorLog.ErrorLogId,
            errorLog.CorrelationId,
            errorLog.ExceptionType,
            errorLog.Message,
            errorLog.StackTrace,
            errorLog.Severity.ToString(),
            errorLog.HttpMethod,
            errorLog.HttpPath,
            errorLog.HttpQueryString,
            errorLog.HttpStatusCode,
            errorLog.UserId,
            errorLog.User?.Username,
            errorLog.IpAddress,
            errorLog.UserAgent,
            headers,
            errorLog.InnerException,
            errorLog.DateCreated
        );
    }

    public async Task<int> DeleteOldErrorLogsAsync(int retentionDays, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);

        var oldErrors = await _context.Set<ErrorLog>()
            .Where(e => e.DateCreated < cutoffDate)
            .ToListAsync(cancellationToken);

        _context.Set<ErrorLog>().RemoveRange(oldErrors);
        await _context.SaveChangesAsync(cancellationToken);

        return oldErrors.Count;
    }

    private static ErrorSeverity MapStatusCodeToSeverity(int statusCode, Exception exception)
    {
        // Map based on status code first
        return statusCode switch
        {
            >= 500 => ErrorSeverity.Critical,
            404 => ErrorSeverity.Info,
            401 or 403 => ErrorSeverity.Warning,
            400 => ErrorSeverity.Error,
            _ => DetermineFromException(exception)
        };
    }

    private static ErrorSeverity DetermineFromException(Exception exception)
    {
        return exception switch
        {
            ArgumentException => ErrorSeverity.Error,
            InvalidOperationException => ErrorSeverity.Error,
            UnauthorizedAccessException => ErrorSeverity.Warning,
            KeyNotFoundException => ErrorSeverity.Info,
            _ => ErrorSeverity.Critical
        };
    }

    public async Task LogClientErrorAsync(ClientErrorRequest request, string ipAddress, CancellationToken cancellationToken = default)
    {
        try
        {
            // Parse user ID if provided
            Guid? userId = null;
            if (!string.IsNullOrEmpty(request.UserId))
            {
                if (Guid.TryParse(request.UserId, out Guid parsedUserId))
                {
                    userId = parsedUserId;
                }
            }

            // Mask IP address
            var maskedIp = PiiMaskingHelper.MaskIpAddress(ipAddress);

            // Generate correlation ID
            var correlationId = Guid.NewGuid().ToString();

            // Truncate stack trace if too long
            var stackTrace = request.StackTrace;
            if (!string.IsNullOrEmpty(stackTrace) && stackTrace.Length > MaxStackTraceLength)
            {
                stackTrace = stackTrace.Substring(0, MaxStackTraceLength) + "\n... (truncated)";
            }

            // Sanitize URL
            var sanitizedUrl = PiiMaskingHelper.SanitizeForLog(request.Url);

            var errorLog = new ErrorLog
            {
                CorrelationId = correlationId,
                ExceptionType = request.ExceptionType,
                Message = request.Message,
                StackTrace = stackTrace,
                Severity = ErrorSeverity.Error, // Client errors default to Error severity
                HttpMethod = "CLIENT", // Special marker to distinguish client errors
                HttpPath = sanitizedUrl,
                HttpQueryString = null,
                HttpStatusCode = null, // Not applicable for client errors
                UserId = userId,
                IpAddress = maskedIp,
                UserAgent = !string.IsNullOrEmpty(request.UserAgent) && request.UserAgent.Length > 512
                    ? request.UserAgent.Substring(0, 512)
                    : request.UserAgent,
                RequestHeaders = null, // Not applicable for client errors
                InnerException = request.ComponentStack // Store React component stack in InnerException field
            };

            _context.Set<ErrorLog>().Add(errorLog);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Log failure to Serilog but don't throw (fire-and-forget pattern)
            _logger.LogWarning(ex, "Failed to log client error to database");
        }
    }
}
