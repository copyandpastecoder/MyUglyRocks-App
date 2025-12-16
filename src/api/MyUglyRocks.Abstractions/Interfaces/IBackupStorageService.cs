namespace MyUglyRocks.Abstractions.Interfaces;

/// <summary>
/// Storage service for database backups (separate R2 bucket with dedicated credentials)
/// </summary>
public interface IBackupStorageService
{
    /// <summary>
    /// Upload a backup file to the backup bucket
    /// </summary>
    /// <param name="key">Object key (e.g., "daily/myuglyrocks_2025-01-01_04-00-00.dump")</param>
    /// <param name="stream">Backup file stream</param>
    /// <param name="contentType">Content type (typically "application/octet-stream")</param>
    /// <param name="metadata">Custom metadata (checksum, backup type, timestamp)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task UploadAsync(
        string key,
        Stream stream,
        string contentType,
        Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Download a backup file from the backup bucket
    /// </summary>
    /// <param name="key">Object key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Stream containing the backup file</returns>
    Task<Stream> GetAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get metadata for a backup file (includes checksum stored during upload)
    /// </summary>
    /// <param name="key">Object key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Dictionary of metadata key-value pairs</returns>
    Task<Dictionary<string, string>> GetMetadataAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// List objects in the backup bucket with optional prefix filter.
    /// Uses pagination to handle >1000 objects (S3 API limit per request).
    /// Note: Does NOT return custom metadata - use GetMetadataAsync for that.
    /// </summary>
    /// <param name="prefix">Optional prefix filter (e.g., "daily/" for daily backups)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of object info (key, size, last modified)</returns>
    Task<IEnumerable<BackupObjectInfo>> ListAsync(string? prefix = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a backup file from the backup bucket
    /// </summary>
    /// <param name="key">Object key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if the backup bucket is configured
    /// </summary>
    bool IsConfigured { get; }
}

/// <summary>
/// Basic object info from S3 LIST operation.
/// Note: Checksum is NOT included because LIST doesn't return custom metadata.
/// Use GetMetadataAsync to fetch checksum for a specific object when needed.
/// </summary>
public record BackupObjectInfo(string Key, long Size, DateTime LastModified);
