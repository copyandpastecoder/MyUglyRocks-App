using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Hangfire job for weekly backup validation.
/// Verifies backup integrity using pg_restore --list (format/CRC check).
/// Runs every Sunday at 5 AM UTC (after daily backup).
/// </summary>
public class BackupValidationJob
{
    private readonly IDatabaseBackupService _backupService;
    private readonly ILogger<BackupValidationJob> _logger;

    public BackupValidationJob(
        IDatabaseBackupService backupService,
        ILogger<BackupValidationJob> logger)
    {
        _backupService = backupService;
        _logger = logger;
    }

    /// <summary>
    /// Validates the most recent backup to ensure it can be restored.
    /// Called by Hangfire recurring job scheduler weekly.
    /// </summary>
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting weekly backup validation...");

        try
        {
            // Get the most recent backup
            var lastBackup = await _backupService.GetLastBackupAsync(cancellationToken);

            if (lastBackup == null)
            {
                _logger.LogWarning("No backups found to validate!");
                return;
            }

            _logger.LogInformation("Validating backup: {R2Key}", lastBackup.R2Key);

            // Validate backup (checksum + pg_restore --list)
            var result = await _backupService.ValidateBackupAsync(lastBackup.R2Key, cancellationToken);

            if (result.Success)
            {
                _logger.LogInformation(
                    "Backup validation passed: {R2Key}",
                    lastBackup.R2Key);
            }
            else
            {
                // Log as error - this is a critical issue that needs attention
                _logger.LogError(
                    "Backup validation FAILED: {R2Key} - {Error}. " +
                    "IMMEDIATE ATTENTION REQUIRED: Recent backups may be corrupted!",
                    lastBackup.R2Key, result.ErrorMessage);

                // Don't throw - we want to log the failure but not trigger Hangfire retries
                // Admin should investigate manually
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Backup validation job failed with exception");
            throw; // Re-throw so Hangfire marks job as failed
        }
    }
}
