namespace MyUglyRocks.Core.Entities;

public enum PhotoType
{
    Before = 0,
    During = 1,
    After = 2
}

public class Photo : SoftDeletableEntity
{
    public Guid PhotoId { get; set; }
    public Guid StageRunId { get; set; }
    public required string StorageKey { get; set; }
    public required string Url { get; set; }
    public string? FileName { get; set; }
    public required string MimeType { get; set; }
    public long FileSizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public PhotoType PhotoType { get; set; }
    public string? Caption { get; set; }
    public int SortOrder { get; set; }

    // Image variants (WebP optimized)
    public string? ThumbnailUrl { get; set; }   // 300px max
    public string? MediumUrl { get; set; }       // 800px max
    public string? LargeUrl { get; set; }        // 1600px max
    public string? BlurHash { get; set; }        // Tiny base64 placeholder

    // Storage keys for variants (for cleanup)
    public string? ThumbnailStorageKey { get; set; }
    public string? MediumStorageKey { get; set; }
    public string? LargeStorageKey { get; set; }

    // Navigation properties
    public virtual StageRun StageRun { get; set; } = null!;
}
