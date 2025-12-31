using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Jobs;

/// <summary>
/// Hangfire background job for processing stage photo variants.
/// Uses three-phase processing: thumbnail first (fast), then large variants (background), then original preservation.
/// Images are fetched from R2 temp storage to avoid storing large byte arrays in Hangfire.
/// </summary>
public class PhotoProcessingJob : BasePhotoProcessingJob<Photo>
{
    public PhotoProcessingJob(
        AppDbContext dbContext,
        IStorageService storageService,
        IImageProcessingService imageProcessingService,
        ILogger<PhotoProcessingJob> logger)
        : base(dbContext, storageService, imageProcessingService, logger)
    {
    }

    protected override DbSet<Photo> GetPhotoDbSet() => DbContext.Set<Photo>();

    protected override async Task<Photo?> FindPhotoByIdAsync(Guid photoId)
        => await DbContext.Set<Photo>().FirstOrDefaultAsync(p => p.PhotoId == photoId);

    protected override string GetStorageFolder(Photo photo) => $"photos/stages/{photo.StageRunId}";

    protected override string GetEntityTypeName() => "photo";

    protected override void UpdatePhotoWithThumbnail(Photo photo, string url, string storageKey, int width, int height, string? blurHash)
    {
        photo.ThumbnailUrl = url;
        photo.ThumbnailStorageKey = storageKey;
        photo.Width = width;
        photo.Height = height;
        photo.BlurHash = blurHash;
    }

    protected override void UpdatePhotoWithLargeVariant(Photo photo, string size, string url, string storageKey)
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

    protected override void UpdatePhotoWithOriginal(Photo photo, string url, string storageKey, string mimeType, long fileSizeBytes)
    {
        photo.OriginalUrl = url;
        photo.OriginalStorageKey = storageKey;
        photo.OriginalMimeType = mimeType;
        photo.OriginalFileSizeBytes = fileSizeBytes;
    }

    protected override void SetProcessingStatus(Photo photo, PhotoProcessingStatus status, string? error = null)
    {
        photo.ProcessingStatus = status;
        photo.ProcessingError = error;
    }

    protected override void SetDateUpdated(Photo photo)
    {
        photo.DateUpdated = DateTime.UtcNow;
    }
}
