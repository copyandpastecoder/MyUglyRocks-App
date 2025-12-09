namespace MyUglyRocks.Abstractions.Interfaces;

public interface IStorageService
{
    /// <summary>
    /// Upload a file to storage
    /// </summary>
    /// <param name="stream">The file stream</param>
    /// <param name="fileName">Original file name (used for content type detection)</param>
    /// <param name="folder">Target folder path (e.g., "photos/cycles" or "avatars")</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The public URL of the uploaded file</returns>
    Task<string> UploadAsync(Stream stream, string fileName, string folder, CancellationToken cancellationToken = default);

    /// <summary>
    /// Upload a file with a specific key
    /// </summary>
    Task<string> UploadAsync(Stream stream, string fileName, string folder, string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a file from storage
    /// </summary>
    /// <param name="key">The storage key (path) of the file</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete multiple files from storage
    /// </summary>
    Task DeleteManyAsync(IEnumerable<string> keys, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a file exists in storage
    /// </summary>
    Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the public URL for a stored file
    /// </summary>
    string GetPublicUrl(string key);

    /// <summary>
    /// Check if storage is configured and available
    /// </summary>
    bool IsConfigured { get; }
}
