using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Hangfire background job for processing inventory photo variants.
/// Uses two-phase processing: thumbnail first (fast), then large variants (background).
/// </summary>
public class InventoryPhotoProcessingJob
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;
    private readonly IImageProcessingService _imageProcessingService;
    private readonly ILogger<InventoryPhotoProcessingJob> _logger;

    public InventoryPhotoProcessingJob(
        AppDbContext dbContext,
        IStorageService storageService,
        IImageProcessingService imageProcessingService,
        ILogger<InventoryPhotoProcessingJob> logger)
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
    public async Task ProcessThumbnailAsync(Guid photoId, byte[] imageData, string fileName)
    {
        _logger.LogInformation("Starting thumbnail processing for inventory photo {PhotoId}", photoId);

        var photo = await _dbContext.Set<InventoryPhoto>()
            .FirstOrDefaultAsync(p => p.InventoryPhotoId == photoId);

        if (photo == null)
        {
            _logger.LogWarning("Inventory photo {PhotoId} not found for thumbnail processing", photoId);
            return;
        }

        try
        {
            using var inputStream = new MemoryStream(imageData);
            var result = await _imageProcessingService.ProcessThumbnailAsync(inputStream, fileName);

            var folder = $"photos/inventory/{photo.InventoryId}";
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
                "Thumbnail ready for inventory photo {PhotoId}: {Width}x{Height}",
                photoId, result.Thumbnail.Width, result.Thumbnail.Height);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process thumbnail for inventory photo {PhotoId}", photoId);

            photo.ProcessingStatus = PhotoProcessingStatus.Failed;
            photo.ProcessingError = ex.Message;
            photo.DateUpdated = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Phase 2: Process large variants in background. User doesn't wait for this.
    /// </summary>
    public async Task ProcessLargeVariantsAsync(Guid photoId, byte[] imageData, string fileName)
    {
        _logger.LogInformation("Starting large variant processing for inventory photo {PhotoId}", photoId);

        var photo = await _dbContext.Set<InventoryPhoto>()
            .FirstOrDefaultAsync(p => p.InventoryPhotoId == photoId);

        if (photo == null)
        {
            _logger.LogWarning("Inventory photo {PhotoId} not found for large variant processing", photoId);
            return;
        }

        try
        {
            using var inputStream = new MemoryStream(imageData);
            var result = await _imageProcessingService.ProcessLargeVariantsAsync(inputStream, fileName);

            var folder = $"photos/inventory/{photo.InventoryId}";
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
                "Large variants ready for inventory photo {PhotoId}: {Sizes}",
                photoId, string.Join(", ", results.Select(r => r.Size)));
        }
        catch (Exception ex)
        {
            // Don't mark as failed - thumbnail is already showing
            _logger.LogError(ex, "Failed to process large variants for inventory photo {PhotoId}", photoId);
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
