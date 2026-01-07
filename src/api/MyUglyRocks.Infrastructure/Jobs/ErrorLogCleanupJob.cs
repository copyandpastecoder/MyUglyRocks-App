using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Background job that deletes old error logs based on retention policy
/// </summary>
public class ErrorLogCleanupJob
{
    private readonly IErrorLogService _errorLogService;
    private readonly ILogger<ErrorLogCleanupJob> _logger;
    private readonly int _retentionDays;

    public ErrorLogCleanupJob(
        IErrorLogService errorLogService,
        ILogger<ErrorLogCleanupJob> logger,
        IConfiguration configuration)
    {
        _errorLogService = errorLogService;
        _logger = logger;
        _retentionDays = int.Parse(configuration["ErrorLogging:RetentionDays"] ?? "180");
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting error log cleanup (retention: {RetentionDays} days)...", _retentionDays);

        try
        {
            var deletedCount = await _errorLogService.DeleteOldErrorLogsAsync(_retentionDays, cancellationToken);

            _logger.LogInformation("Error log cleanup completed. Deleted {DeletedCount} records.", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error log cleanup failed");
            throw; // Re-throw to mark job as failed in Hangfire
        }
    }
}
