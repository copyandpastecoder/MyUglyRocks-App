namespace MyUglyRocks.Abstractions.DTOs;

/// <summary>
/// Type of backup operation
/// </summary>
public enum BackupType
{
    /// <summary>Daily 4 AM UTC scheduled backup</summary>
    Scheduled = 0,
    /// <summary>Admin-triggered manual backup</summary>
    Manual = 1,
    /// <summary>Safety backup created before restore</summary>
    PreRestore = 2
}

/// <summary>
/// Result of a backup operation
/// </summary>
public record BackupResult(
    bool Success,
    string? R2Key,
    long? SizeBytes,
    TimeSpan Duration,
    string? Checksum,
    string? ErrorMessage
);

/// <summary>
/// Backup metadata. Note: Checksum is null when returned from ListBackupsAsync
/// because S3/R2 LIST operations don't include custom metadata.
/// Use GetBackupMetadataAsync to fetch checksum for a specific backup when needed
/// (e.g., on-demand when user expands a row in the admin UI).
/// </summary>
public record BackupInfo(
    string R2Key,
    string FileName,
    DateTime CreatedAt,
    long SizeBytes,
    BackupType Type,
    string? Checksum
);

/// <summary>
/// Result of a restore operation
/// </summary>
public record RestoreResult(
    bool Success,
    string? PreRestoreBackupKey,
    TimeSpan Duration,
    string? ErrorMessage
);

/// <summary>
/// Result of backup validation
/// </summary>
public record ValidationResult(
    bool Success,
    string? ErrorMessage
);

/// <summary>
/// Backup status for admin dashboard
/// </summary>
public record BackupStatusDto
{
    public DateTime? LastBackupDate { get; init; }
    public long? LastBackupSize { get; init; }
    public string? LastBackupKey { get; init; }
    public string? LastBackupType { get; init; }
    public string? LastBackupChecksum { get; init; }
}

/// <summary>
/// Request to restore a backup
/// </summary>
public record RestoreRequest(string BackupKey, string Confirmation);
