using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Infrastructure.Configuration;

namespace MyUglyRocks.Infrastructure.Services;

public class R2StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly R2Settings _settings;
    private readonly ILogger<R2StorageService> _logger;

    private static readonly Dictionary<string, string> ContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".gif", "image/gif" },
        { ".webp", "image/webp" },
        { ".heic", "image/heic" },
        { ".heif", "image/heif" }
    };

    public R2StorageService(
        IAmazonS3 s3Client,
        IOptions<R2Settings> settings,
        ILogger<R2StorageService> logger)
    {
        _s3Client = s3Client;
        _settings = settings.Value;
        _logger = logger;
    }

    public bool IsConfigured => _settings.IsConfigured;

    public async Task<string> UploadAsync(Stream stream, string fileName, string folder, CancellationToken cancellationToken = default)
    {
        var key = GenerateKey(fileName, folder);
        return await UploadAsync(stream, fileName, folder, key, cancellationToken);
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, string folder, string key, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("R2 storage is not configured, upload skipped");
            throw new InvalidOperationException("Storage is not configured");
        }

        var contentType = GetContentType(fileName);
        var fullKey = string.IsNullOrEmpty(folder) ? key : $"{folder.TrimEnd('/')}/{key}";

        try
        {
            var request = new PutObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = fullKey,
                InputStream = stream,
                ContentType = contentType,
                DisablePayloadSigning = true, // Required for R2
                DisableDefaultChecksumValidation = true // Required for R2 - doesn't support checksum headers
            };

            await _s3Client.PutObjectAsync(request, cancellationToken);

            var publicUrl = GetPublicUrl(fullKey);
            _logger.LogInformation("File uploaded to R2: {Key} -> {Url}", PiiMaskingHelper.SanitizeForLog(fullKey), publicUrl);

            return publicUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to R2: {Key}", PiiMaskingHelper.SanitizeForLog(fullKey));
            throw;
        }
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("R2 storage is not configured, delete skipped");
            return;
        }

        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = key
            };

            await _s3Client.DeleteObjectAsync(request, cancellationToken);
            _logger.LogInformation("File deleted from R2: {Key}", PiiMaskingHelper.SanitizeForLog(key));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file from R2: {Key}", PiiMaskingHelper.SanitizeForLog(key));
            throw;
        }
    }

    public async Task DeleteManyAsync(IEnumerable<string> keys, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("R2 storage is not configured, delete skipped");
            return;
        }

        var keyList = keys.ToList();
        if (keyList.Count == 0) return;

        try
        {
            var request = new DeleteObjectsRequest
            {
                BucketName = _settings.BucketName,
                Objects = keyList.Select(k => new KeyVersion { Key = k }).ToList()
            };

            await _s3Client.DeleteObjectsAsync(request, cancellationToken);
            _logger.LogInformation("Deleted {Count} files from R2", keyList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete {Count} files from R2", keyList.Count);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured) return false;

        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _settings.BucketName,
                Key = key
            };

            await _s3Client.GetObjectMetadataAsync(request, cancellationToken);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public string GetPublicUrl(string key)
    {
        if (!string.IsNullOrEmpty(_settings.PublicUrl))
        {
            return $"{_settings.PublicUrl.TrimEnd('/')}/{key}";
        }

        // Default R2 public bucket URL pattern
        return $"https://pub-{_settings.AccountId}.r2.dev/{key}";
    }

    private static string GenerateKey(string fileName, string folder)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var uniqueId = Guid.NewGuid().ToString("N")[..12];
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
        return $"{timestamp}-{uniqueId}{extension}";
    }

    private static string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        return ContentTypes.TryGetValue(extension, out var contentType)
            ? contentType
            : "application/octet-stream";
    }
}
