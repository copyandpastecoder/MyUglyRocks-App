using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

/// <summary>
/// Service for database backup and restore operations
/// </summary>
public interface IDatabaseBackupService
{
    /// <summary>
    /// Creates a database backup and uploads to R2
    /// </summary>
    /// <param name="backupType">Type of backup (Scheduled, Manual, PreRestore)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result containing R2 key, size, checksum, and duration</returns>
    Task<BackupResult> CreateBackupAsync(BackupType backupType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists available backups from R2
    /// </summary>
    /// <param name="limit">Maximum number of backups to return (default 50)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of backup info (Note: Checksum is null, use GetBackupMetadataAsync for checksum)</returns>
    Task<IEnumerable<BackupInfo>> ListBackupsAsync(int limit = 50, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the most recent backup info
    /// </summary>
    Task<BackupInfo?> GetLastBackupAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Restores database from a backup
    /// </summary>
    /// <param name="backupKey">R2 key of the backup to restore</param>
    /// <param name="createPreRestoreBackup">Whether to create a safety backup before restore (default true)</param>
    /// <param name="useSingleTransaction">Whether to use --single-transaction (default true, disable for large DBs)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result containing pre-restore backup key (if created) and duration</returns>
    Task<RestoreResult> RestoreAsync(
        string backupKey,
        bool createPreRestoreBackup = true,
        bool useSingleTransaction = true,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Applies retention policy - deletes old backups while keeping minimum counts
    /// </summary>
    Task ApplyRetentionPolicyAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates backup integrity using pg_restore --list (format/CRC check).
    /// This verifies the backup file is readable and not corrupted, but does NOT
    /// actually restore data.
    /// </summary>
    /// <param name="backupKey">R2 key of the backup to validate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result</returns>
    Task<ValidationResult> ValidateBackupAsync(string backupKey, CancellationToken cancellationToken = default);
}
