using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Hangfire job for scheduled database backups.
/// Runs daily at 4 AM UTC (configured in Program.cs as recurring job).
/// </summary>
public class DatabaseBackupJob
{
    private readonly IDatabaseBackupService _backupService;
    private readonly ILogger<DatabaseBackupJob> _logger;

    public DatabaseBackupJob(
        IDatabaseBackupService backupService,
        ILogger<DatabaseBackupJob> logger)
    {
        _backupService = backupService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a scheduled backup and applies retention policy.
    /// Called by Hangfire recurring job scheduler.
    /// </summary>
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting scheduled database backup...");

        try
        {
            // 1. Create backup
            var result = await _backupService.CreateBackupAsync(BackupType.Scheduled, cancellationToken);

            if (result.Success)
            {
                _logger.LogInformation(
                    "Scheduled backup completed: {R2Key}, Size: {Size} bytes, Duration: {Duration}",
                    result.R2Key, result.SizeBytes, result.Duration);
            }
            else
            {
                _logger.LogError("Scheduled backup failed: {Error}", result.ErrorMessage);
                // Don't throw - let Hangfire mark as complete but log the error
                // This prevents infinite retries that could spam the logs
                return;
            }

            // 2. Apply retention policy (clean up old backups)
            await _backupService.ApplyRetentionPolicyAsync(cancellationToken);
            _logger.LogInformation("Retention policy applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Scheduled backup job failed with exception");
            throw; // Re-throw so Hangfire marks job as failed and can retry if configured
        }
    }
}
