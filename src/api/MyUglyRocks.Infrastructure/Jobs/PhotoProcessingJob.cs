using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Hangfire background job for processing photo variants.
/// Uploads image variants to R2 storage and updates the photo record.
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
    /// Process a photo: create variants and upload to storage.
    /// Called by Hangfire in the background.
    /// </summary>
    public async Task ProcessPhotoAsync(Guid photoId, byte[] imageData, string fileName)
    {
        _logger.LogInformation("Starting background processing for photo {PhotoId}", photoId);

        var photo = await _dbContext.Set<Photo>()
            .FirstOrDefaultAsync(p => p.PhotoId == photoId);

        if (photo == null)
        {
            _logger.LogWarning("Photo {PhotoId} not found for processing", photoId);
            return;
        }

        try
        {
            // Process image into variants
            using var inputStream = new MemoryStream(imageData);
            var processed = await _imageProcessingService.ProcessImageAsync(inputStream, fileName);

            var folder = $"photos/stages/{photo.StageRunId}";
            var baseKey = $"{DateTime.UtcNow:yyyyMMdd}-{photoId:N}";

            // Upload all variants in parallel for speed
            var uploadTasks = new List<Task<(string Size, string Url, string StorageKey)>>();

            foreach (var variant in processed.Variants)
            {
                var variantKey = $"{baseKey}-{variant.Size}{variant.Extension}";
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
                    case "thumbnail":
                        photo.ThumbnailUrl = url;
                        photo.ThumbnailStorageKey = storageKey;
                        break;
                    case "medium":
                        photo.MediumUrl = url;
                        photo.MediumStorageKey = storageKey;
                        break;
                    case "large":
                        photo.LargeUrl = url;
                        photo.LargeStorageKey = storageKey;
                        break;
                }
            }

            // Dispose variant streams
            foreach (var variant in processed.Variants)
            {
                await variant.Stream.DisposeAsync();
            }

            // Update photo metadata
            photo.Width = processed.OriginalWidth;
            photo.Height = processed.OriginalHeight;
            photo.BlurHash = processed.BlurHash;
            photo.ProcessingStatus = PhotoProcessingStatus.Completed;
            photo.ProcessingError = null;
            photo.DateUpdated = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Completed processing photo {PhotoId}: {VariantCount} variants uploaded in parallel",
                photoId, results.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process photo {PhotoId}", photoId);

            // Mark photo as failed
            photo.ProcessingStatus = PhotoProcessingStatus.Failed;
            photo.ProcessingError = ex.Message;
            photo.DateUpdated = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
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
