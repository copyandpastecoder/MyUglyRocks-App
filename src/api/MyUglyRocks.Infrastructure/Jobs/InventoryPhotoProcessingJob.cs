using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Hangfire background job for processing inventory photo variants.
/// Uses three-phase processing: thumbnail first (fast), then large variants (background), then original preservation.
/// Images are fetched from R2 temp storage to avoid storing large byte arrays in Hangfire.
/// </summary>
public class InventoryPhotoProcessingJob : BasePhotoProcessingJob<InventoryPhoto>
{
    public InventoryPhotoProcessingJob(
        AppDbContext dbContext,
        IStorageService storageService,
        IImageProcessingService imageProcessingService,
        ILogger<InventoryPhotoProcessingJob> logger)
        : base(dbContext, storageService, imageProcessingService, logger)
    {
    }

    protected override DbSet<InventoryPhoto> GetPhotoDbSet() => DbContext.Set<InventoryPhoto>();

    protected override async Task<InventoryPhoto?> FindPhotoByIdAsync(Guid photoId)
        => await DbContext.Set<InventoryPhoto>().FirstOrDefaultAsync(p => p.InventoryPhotoId == photoId);

    protected override string GetStorageFolder(InventoryPhoto photo) => $"photos/inventory/{photo.InventoryId}";

    protected override string GetEntityTypeName() => "inventory photo";

    protected override void UpdatePhotoWithThumbnail(InventoryPhoto photo, string url, string storageKey, int width, int height, string? blurHash)
    {
        photo.ThumbnailUrl = url;
        photo.ThumbnailStorageKey = storageKey;
        photo.Width = width;
        photo.Height = height;
        photo.BlurHash = blurHash;
    }

    protected override void UpdatePhotoWithLargeVariant(InventoryPhoto photo, string size, string url, string storageKey)
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

    protected override void UpdatePhotoWithOriginal(InventoryPhoto photo, string url, string storageKey, string mimeType, long fileSizeBytes)
    {
        photo.OriginalUrl = url;
        photo.OriginalStorageKey = storageKey;
        photo.OriginalMimeType = mimeType;
        photo.OriginalFileSizeBytes = fileSizeBytes;
    }

    protected override void SetProcessingStatus(InventoryPhoto photo, PhotoProcessingStatus status, string? error = null)
    {
        photo.ProcessingStatus = status;
        photo.ProcessingError = error;
    }

    protected override void SetDateUpdated(InventoryPhoto photo)
    {
        photo.DateUpdated = DateTime.UtcNow;
    }
}
