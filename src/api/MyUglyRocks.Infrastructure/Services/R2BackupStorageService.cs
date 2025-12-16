using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Infrastructure.Configuration;

namespace MyUglyRocks.Infrastructure.Services;

/// <summary>
/// R2 storage service for database backups.
/// Uses a dedicated bucket with separate credentials for security isolation.
/// </summary>
public class R2BackupStorageService : IBackupStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly R2Settings _settings;
    private readonly ILogger<R2BackupStorageService> _logger;

    public R2BackupStorageService(
        IAmazonS3 s3Client,
        IOptions<R2Settings> settings,
        ILogger<R2BackupStorageService> logger)
    {
        _s3Client = s3Client;
        _settings = settings.Value;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_settings.BackupBucketName) &&
                                !string.IsNullOrEmpty(_settings.AccountId) &&
                                !string.IsNullOrEmpty(_settings.AccessKeyId);

    public async Task UploadAsync(
        string key,
        Stream stream,
        string contentType,
        Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Backup storage is not configured. Set R2:BackupBucketName in configuration.");
        }

        try
        {
            var request = new PutObjectRequest
            {
                BucketName = _settings.BackupBucketName,
                Key = key,
                InputStream = stream,
                ContentType = contentType,
                // Required for R2 - it doesn't support SigV4 payload signing
                // Safe because we use HTTPS (encryption in transit)
                DisablePayloadSigning = true,
                DisableDefaultChecksumValidation = true
            };

            // Add custom metadata (checksum, backup type, timestamp)
            if (metadata != null)
            {
                foreach (var kvp in metadata)
                {
                    request.Metadata.Add(kvp.Key, kvp.Value);
                }
            }

            await _s3Client.PutObjectAsync(request, cancellationToken);
            _logger.LogInformation("Backup uploaded to R2: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload backup to R2: {Key}", key);
            throw;
        }
    }

    public async Task<Stream> GetAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Backup storage is not configured.");
        }

        try
        {
            var request = new GetObjectRequest
            {
                BucketName = _settings.BackupBucketName,
                Key = key
            };

            using var response = await _s3Client.GetObjectAsync(request, cancellationToken);

            // Copy to MemoryStream so we can dispose the S3 response
            var memoryStream = new MemoryStream();
            await response.ResponseStream.CopyToAsync(memoryStream, cancellationToken);
            memoryStream.Position = 0;

            _logger.LogInformation("Downloaded backup from R2: {Key}, Size: {Size} bytes", key, memoryStream.Length);
            return memoryStream;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Backup not found in R2: {Key}", key);
            throw new FileNotFoundException($"Backup not found: {key}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download backup from R2: {Key}", key);
            throw;
        }
    }

    public async Task<Dictionary<string, string>> GetMetadataAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Backup storage is not configured.");
        }

        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _settings.BackupBucketName,
                Key = key
            };

            var response = await _s3Client.GetObjectMetadataAsync(request, cancellationToken);

            // Convert metadata collection to dictionary
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var metaKey in response.Metadata.Keys)
            {
                result[metaKey] = response.Metadata[metaKey];
            }

            return result;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Backup not found in R2: {Key}", key);
            throw new FileNotFoundException($"Backup not found: {key}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get metadata from R2: {Key}", key);
            throw;
        }
    }

    public async Task<IEnumerable<BackupObjectInfo>> ListAsync(string? prefix = null, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Backup storage is not configured.");
        }

        var results = new List<BackupObjectInfo>();
        string? continuationToken = null;

        try
        {
            do
            {
                var request = new ListObjectsV2Request
                {
                    BucketName = _settings.BackupBucketName,
                    Prefix = prefix,
                    ContinuationToken = continuationToken
                };

                var response = await _s3Client.ListObjectsV2Async(request, cancellationToken);

                results.AddRange(response.S3Objects.Select(o =>
                    new BackupObjectInfo(o.Key, o.Size ?? 0, o.LastModified ?? DateTime.MinValue)));

                continuationToken = response.IsTruncated == true ? response.NextContinuationToken : null;

            } while (continuationToken != null);

            _logger.LogDebug("Listed {Count} objects in backup bucket with prefix: {Prefix}", results.Count, prefix ?? "(none)");
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list objects in backup bucket with prefix: {Prefix}", prefix);
            throw;
        }
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Backup storage is not configured, delete skipped");
            return;
        }

        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _settings.BackupBucketName,
                Key = key
            };

            await _s3Client.DeleteObjectAsync(request, cancellationToken);
            _logger.LogInformation("Deleted backup from R2: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete backup from R2: {Key}", key);
            throw;
        }
    }
}
