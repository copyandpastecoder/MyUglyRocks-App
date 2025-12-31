using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Base class for photo processing jobs that handles common three-phase processing logic.
/// Phase 1: Thumbnail (fast, user sees immediately)
/// Phase 2: Large WebP variants (background)
/// Phase 3: Original preservation (background, cleans up temp file)
/// </summary>
/// <typeparam name="TPhoto">Photo entity type (Photo or InventoryPhoto)</typeparam>
public abstract class BasePhotoProcessingJob<TPhoto> where TPhoto : class
{
    protected readonly AppDbContext DbContext;
    protected readonly IStorageService StorageService;
    protected readonly IImageProcessingService ImageProcessingService;
    protected readonly ILogger Logger;

    protected BasePhotoProcessingJob(
        AppDbContext dbContext,
        IStorageService storageService,
        IImageProcessingService imageProcessingService,
        ILogger logger)
    {
        DbContext = dbContext;
        StorageService = storageService;
        ImageProcessingService = imageProcessingService;
        Logger = logger;
    }

    /// <summary>
    /// Get the DbSet for the photo entity type
    /// </summary>
    protected abstract DbSet<TPhoto> GetPhotoDbSet();

    /// <summary>
    /// Find photo by ID
    /// </summary>
    protected abstract Task<TPhoto?> FindPhotoByIdAsync(Guid photoId);

    /// <summary>
    /// Get the storage folder path for this photo (e.g., "photos/stages/{stageRunId}")
    /// </summary>
    protected abstract string GetStorageFolder(TPhoto photo);

    /// <summary>
    /// Get the entity type name for logging (e.g., "photo" or "inventory photo")
    /// </summary>
    protected abstract string GetEntityTypeName();

    /// <summary>
    /// Update photo entity with thumbnail data
    /// </summary>
    protected abstract void UpdatePhotoWithThumbnail(TPhoto photo, string url, string storageKey, int width, int height, string? blurHash);

    /// <summary>
    /// Update photo entity with large variant data
    /// </summary>
    protected abstract void UpdatePhotoWithLargeVariant(TPhoto photo, string size, string url, string storageKey);

    /// <summary>
    /// Update photo entity with original data
    /// </summary>
    protected abstract void UpdatePhotoWithOriginal(TPhoto photo, string url, string storageKey, string mimeType, long fileSizeBytes);

    /// <summary>
    /// Set photo processing status
    /// </summary>
    protected abstract void SetProcessingStatus(TPhoto photo, PhotoProcessingStatus status, string? error = null);

    /// <summary>
    /// Set photo updated timestamp
    /// </summary>
    protected abstract void SetDateUpdated(TPhoto photo);

    /// <summary>
    /// Phase 1: Process thumbnail only and mark as completed immediately.
    /// User sees the thumbnail right away without waiting for large variants.
    /// </summary>
    public async Task ProcessThumbnailAsync(Guid photoId, string tempStorageKey, string fileName)
    {
        Logger.LogInformation("Starting thumbnail processing for {EntityType} {PhotoId}", GetEntityTypeName(), photoId);

        var photo = await FindPhotoByIdAsync(photoId);

        if (photo == null)
        {
            Logger.LogWarning("{EntityType} {PhotoId} not found for thumbnail processing", GetEntityTypeName(), photoId);
            // Clean up temp file since continuation job won't run
            await CleanupTempFileAsync(tempStorageKey);
            return;
        }

        try
        {
            // Fetch image from R2 temp storage instead of receiving byte[] through Hangfire
            using var inputStream = await StorageService.GetStreamAsync(tempStorageKey);
            if (inputStream == null)
            {
                Logger.LogError("Temp image not found in R2 for {EntityType} {PhotoId}: {Key}", GetEntityTypeName(), photoId, tempStorageKey);
                SetProcessingStatus(photo, PhotoProcessingStatus.Failed, "Temp image not found");
                SetDateUpdated(photo);
                await DbContext.SaveChangesAsync();
                // Attempt cleanup in case the file still exists
                await CleanupTempFileAsync(tempStorageKey);
                return;
            }

            var result = await ImageProcessingService.ProcessThumbnailAsync(inputStream, fileName);

            var folder = GetStorageFolder(photo);
            var baseKey = $"{DateTime.UtcNow:yyyyMMdd}-{photoId:N}";
            var thumbnailKey = $"{baseKey}-thumbnail";

            // Upload thumbnail
            var (_, url, storageKey) = await UploadVariantAsync(result.Thumbnail, folder, thumbnailKey);

            // Update photo with thumbnail - mark as Completed so user sees it immediately
            UpdatePhotoWithThumbnail(photo, url, storageKey, result.OriginalWidth, result.OriginalHeight, result.BlurHash);
            SetProcessingStatus(photo, PhotoProcessingStatus.Completed);  // User sees thumbnail now!
            SetDateUpdated(photo);

            await result.Thumbnail.Stream.DisposeAsync();
            await DbContext.SaveChangesAsync();

            Logger.LogInformation(
                "Thumbnail ready for {EntityType} {PhotoId}: {Width}x{Height}",
                GetEntityTypeName(), photoId, result.Thumbnail.Width, result.Thumbnail.Height);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to process thumbnail for {EntityType} {PhotoId}", GetEntityTypeName(), photoId);

            SetProcessingStatus(photo, PhotoProcessingStatus.Failed, ex.Message);
            SetDateUpdated(photo);

            await DbContext.SaveChangesAsync();

            // Clean up temp file since continuation job won't run on failure
            await CleanupTempFileAsync(tempStorageKey);
            throw; // Re-throw so Hangfire marks job as failed and doesn't run continuation
        }
    }

    /// <summary>
    /// Phase 2: Process large WebP variant only. User can view this while original is being preserved.
    /// Does NOT clean up temp file - Phase 3 will do that.
    /// </summary>
    public async Task ProcessLargeVariantsAsync(Guid photoId, string tempStorageKey, string fileName)
    {
        Logger.LogInformation("Starting large variant processing for {EntityType} {PhotoId}", GetEntityTypeName(), photoId);

        var photo = await FindPhotoByIdAsync(photoId);

        if (photo == null)
        {
            Logger.LogWarning("{EntityType} {PhotoId} not found for large variant processing", GetEntityTypeName(), photoId);
            return;
        }

        try
        {
            // Fetch image from R2 temp storage
            using var inputStream = await StorageService.GetStreamAsync(tempStorageKey);
            if (inputStream == null)
            {
                Logger.LogError("Temp image not found in R2 for {EntityType} {PhotoId}: {Key}", GetEntityTypeName(), photoId, tempStorageKey);
                return;
            }

            var result = await ImageProcessingService.ProcessLargeVariantsAsync(inputStream, fileName);

            var folder = GetStorageFolder(photo);
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
                UpdatePhotoWithLargeVariant(photo, size, url, storageKey);
            }

            // Dispose variant streams
            foreach (var variant in result.Variants)
            {
                await variant.Stream.DisposeAsync();
            }

            SetDateUpdated(photo);
            await DbContext.SaveChangesAsync();

            Logger.LogInformation(
                "Large variants ready for {EntityType} {PhotoId}: {Sizes}",
                GetEntityTypeName(), photoId, string.Join(", ", results.Select(r => r.Size)));
        }
        catch (Exception ex)
        {
            // Don't mark as failed - thumbnail is already showing
            Logger.LogError(ex, "Failed to process large variants for {EntityType} {PhotoId}", GetEntityTypeName(), photoId);
        }
        // NOTE: NOT cleaning up temp file here - Phase 3 will do that
    }

    /// <summary>
    /// Phase 3: Preserve the original uploaded photo without any conversion.
    /// Cleans up the temp storage file after preserving the original.
    ///
    /// Note: Original files are stored WITH file extensions (e.g., "photo-original.jpg")
    /// while WebP variants are stored WITHOUT extensions (e.g., "photo-thumbnail").
    /// Both approaches work correctly because R2 uses Content-Type metadata for serving files.
    /// Originals include extensions for user-friendliness when downloading.
    /// </summary>
    public async Task PreserveOriginalAsync(Guid photoId, string tempStorageKey, string fileName)
    {
        Logger.LogInformation("Starting original preservation for {EntityType} {PhotoId}", GetEntityTypeName(), photoId);

        var photo = await FindPhotoByIdAsync(photoId);

        if (photo == null)
        {
            Logger.LogWarning("{EntityType} {PhotoId} not found for original preservation", GetEntityTypeName(), photoId);
            // Clean up temp file even if photo not found
            await CleanupTempFileAsync(tempStorageKey);
            return;
        }

        try
        {
            // Fetch original from R2 temp storage
            using var inputStream = await StorageService.GetStreamAsync(tempStorageKey);
            if (inputStream == null)
            {
                Logger.LogError("Temp image not found in R2 for {EntityType} {PhotoId}: {Key}", GetEntityTypeName(), photoId, tempStorageKey);
                await CleanupTempFileAsync(tempStorageKey);
                return;
            }

            // Preserve the original without conversion
            var result = await ImageProcessingService.PreserveOriginalAsync(inputStream, fileName);

            var folder = GetStorageFolder(photo);
            var baseKey = $"{DateTime.UtcNow:yyyyMMdd}-{photoId:N}";
            var originalKey = $"{baseKey}-original{result.Extension}";

            // Upload original to R2
            var originalUrl = await StorageService.UploadAsync(
                result.Stream,
                $"{originalKey}",
                folder,
                originalKey);

            var originalStorageKey = new Uri(originalUrl).AbsolutePath.TrimStart('/');

            // Update photo with original URL
            UpdatePhotoWithOriginal(photo, originalUrl, originalStorageKey, result.MimeType, result.FileSizeBytes);
            SetDateUpdated(photo);

            await result.Stream.DisposeAsync();
            await DbContext.SaveChangesAsync();

            Logger.LogInformation(
                "Original preserved for {EntityType} {PhotoId}: {Extension}, {Size} bytes",
                GetEntityTypeName(), photoId, result.Extension, result.FileSizeBytes);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to preserve original for {EntityType} {PhotoId}", GetEntityTypeName(), photoId);
        }
        finally
        {
            // Always clean up temp file after preserving original
            await CleanupTempFileAsync(tempStorageKey);
        }
    }

    private async Task CleanupTempFileAsync(string tempStorageKey)
    {
        try
        {
            await StorageService.DeleteAsync(tempStorageKey);
            Logger.LogDebug("Cleaned up temp file: {Key}", tempStorageKey);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to clean up temp file: {Key}", tempStorageKey);
        }
    }

    /// <summary>
    /// Upload a processed WebP variant to storage.
    ///
    /// Note: Variants are stored WITHOUT file extensions (e.g., "photo-thumbnail")
    /// for cleaner internal URLs. Content-Type is set via R2 metadata, so extensions
    /// are not required for proper serving. Original uploaded files ARE stored with
    /// extensions for user-friendliness when downloading.
    /// </summary>
    private async Task<(string Size, string Url, string StorageKey)> UploadVariantAsync(
        ImageVariant variant,
        string folder,
        string variantKey)
    {
        var url = await StorageService.UploadAsync(
            variant.Stream,
            $"{variantKey}{variant.Extension}",
            folder,
            variantKey);

        var storageKey = new Uri(url).AbsolutePath.TrimStart('/');

        return (variant.Size, url, storageKey);
    }
}
