using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Hangfire background job for processing stage photo variants.
/// Uses two-phase processing: thumbnail first (fast), then large variants (background).
/// Images are fetched from R2 temp storage to avoid storing large byte arrays in Hangfire.
/// </summary>
public class PhotoProcessingJob
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly IImageProcessingService _imageProcessingService;
    private readonly ILogger<PhotoProcessingJob> _logger;

    public PhotoProcessingJob(
        AppDbContext dbContext,
        IStorageService storageService,
        IImageProcessingService imageProcessingService,
        ILogger<PhotoProcessingJob> logger)
    {
        _dbContext = dbContext;
        _storageService = storageService;
        _imageProcessingService = imageProcessingService;
        _logger = logger;
    }

    /// <summary>
    /// Phase 1: Process thumbnail only and mark as completed immediately.
    /// User sees the thumbnail right away without waiting for large variants.
    /// </summary>
    /// <param name="photoId">The photo ID</param>
    /// <param name="tempStorageKey">R2 temp storage key where the original image is stored</param>
    /// <param name="fileName">Original file name for content type detection</param>
    public async Task ProcessThumbnailAsync(Guid photoId, string tempStorageKey, string fileName)
    {
        _logger.LogInformation("Starting thumbnail processing for photo {PhotoId}", photoId);

        var photo = await _dbContext.Set<Photo>()
            .FirstOrDefaultAsync(p => p.PhotoId == photoId);

        if (photo == null)
        {
            _logger.LogWarning("Photo {PhotoId} not found for thumbnail processing", photoId);
            // Clean up temp file since continuation job won't run
            await CleanupTempFileAsync(tempStorageKey);
            return;
        }

        try
        {
            // Fetch image from R2 temp storage instead of receiving byte[] through Hangfire
            using var inputStream = await _storageService.GetStreamAsync(tempStorageKey);
            if (inputStream == null)
            {
                _logger.LogError("Temp image not found in R2 for photo {PhotoId}: {Key}", photoId, tempStorageKey);
                photo.ProcessingStatus = PhotoProcessingStatus.Failed;
                photo.ProcessingError = "Temp image not found";
                photo.DateUpdated = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
                // No cleanup needed - file doesn't exist
                return;
            }

            var result = await _imageProcessingService.ProcessThumbnailAsync(inputStream, fileName);

            var folder = $"photos/stages/{photo.StageRunId}";
            var baseKey = $"{DateTime.UtcNow:yyyyMMdd}-{photoId:N}";
            var thumbnailKey = $"{baseKey}-thumbnail";

            // Upload thumbnail
            var (_, url, storageKey) = await UploadVariantAsync(result.Thumbnail, folder, thumbnailKey);

            // Update photo with thumbnail - mark as Completed so user sees it immediately
            photo.ThumbnailUrl = url;
            photo.ThumbnailStorageKey = storageKey;
            photo.Width = result.OriginalWidth;
            photo.Height = result.OriginalHeight;
            photo.BlurHash = result.BlurHash;
            photo.ProcessingStatus = PhotoProcessingStatus.Completed;  // User sees thumbnail now!
            photo.ProcessingError = null;
            photo.DateUpdated = DateTime.UtcNow;

            await result.Thumbnail.Stream.DisposeAsync();
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Thumbnail ready for photo {PhotoId}: {Width}x{Height}",
                photoId, result.Thumbnail.Width, result.Thumbnail.Height);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process thumbnail for photo {PhotoId}", photoId);

            photo.ProcessingStatus = PhotoProcessingStatus.Failed;
            photo.ProcessingError = ex.Message;
            photo.DateUpdated = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            // Clean up temp file since continuation job won't run on failure
            await CleanupTempFileAsync(tempStorageKey);
            throw; // Re-throw so Hangfire marks job as failed and doesn't run continuation
        }
    }

    /// <summary>
    /// Phase 2: Process large variants in background. User doesn't wait for this.
    /// Also cleans up the temp storage file after processing.
    /// </summary>
    /// <param name="photoId">The photo ID</param>
    /// <param name="tempStorageKey">R2 temp storage key where the original image is stored</param>
    /// <param name="fileName">Original file name for content type detection</param>
    public async Task ProcessLargeVariantsAsync(Guid photoId, string tempStorageKey, string fileName)
    {
        _logger.LogInformation("Starting large variant processing for photo {PhotoId}", photoId);

        var photo = await _dbContext.Set<Photo>()
            .FirstOrDefaultAsync(p => p.PhotoId == photoId);

        if (photo == null)
        {
            _logger.LogWarning("Photo {PhotoId} not found for large variant processing", photoId);
            // Clean up temp file even if photo not found
            await CleanupTempFileAsync(tempStorageKey);
            return;
        }

        try
        {
            // Fetch image from R2 temp storage
            using var inputStream = await _storageService.GetStreamAsync(tempStorageKey);
            if (inputStream == null)
            {
                _logger.LogError("Temp image not found in R2 for photo {PhotoId}: {Key}", photoId, tempStorageKey);
                return;
            }

            var result = await _imageProcessingService.ProcessLargeVariantsAsync(inputStream, fileName);

            var folder = $"photos/stages/{photo.StageRunId}";
            var baseKey = $"{DateTime.UtcNow:yyyyMMdd}-{photoId:N}";

            // Upload large variants in parallel
            var uploadTasks = new List<Task<(string Size, string Url, string StorageKey)>>();
            foreach (var variant in result.Variants)
            {
                var variantKey = $"{baseKey}-{variant.Size}";
                uploadTasks.Add(UploadVariantAsync(variant, folder, variantKey));
            }

            var results = await Task.WhenAll(uploadTasks);

            // Update photo with variant URLs
            foreach (var (size, url, storageKey) in results)
            {
                switch (size)
                {
                    case "original":
                        photo.Url = url;
                        photo.StorageKey = storageKey;
                        break;
                    case "large":
                        photo.LargeUrl = url;
                        photo.LargeStorageKey = storageKey;
                        break;
                }
            }

            // Dispose variant streams
            foreach (var variant in result.Variants)
            {
                await variant.Stream.DisposeAsync();
            }

            photo.DateUpdated = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Large variants ready for photo {PhotoId}: {Sizes}",
                photoId, string.Join(", ", results.Select(r => r.Size)));
        }
        catch (Exception ex)
        {
            // Don't mark as failed - thumbnail is already showing
            _logger.LogError(ex, "Failed to process large variants for photo {PhotoId}", photoId);
        }
        finally
        {
            // Always clean up temp file after processing
            await CleanupTempFileAsync(tempStorageKey);
        }
    }

    private async Task CleanupTempFileAsync(string tempStorageKey)
    {
        try
        {
            await _storageService.DeleteAsync(tempStorageKey);
            _logger.LogDebug("Cleaned up temp file: {Key}", tempStorageKey);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to clean up temp file: {Key}", tempStorageKey);
        }
    }

    private async Task<(string Size, string Url, string StorageKey)> UploadVariantAsync(
        ImageVariant variant,
        string folder,
        string variantKey)
    {
        var url = await _storageService.UploadAsync(
            variant.Stream,
            $"{variantKey}{variant.Extension}",
            folder,
            variantKey);

        var storageKey = new Uri(url).AbsolutePath.TrimStart('/');

        return (variant.Size, url, storageKey);
    }
}
