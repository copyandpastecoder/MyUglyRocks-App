namespace MyUglyRocks.Core.Entities;

public class InventoryPhoto : BaseEntity
{
    public Guid InventoryPhotoId { get; set; }
    public Guid InventoryId { get; set; }
    public Guid? InventorySpecimenId { get; set; }  // Optional link to a specific specimen
    public required string StorageKey { get; set; }
    public required string Url { get; set; }
    public string? FileName { get; set; }
    public required string MimeType { get; set; }
    public long FileSizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? Caption { get; set; }
    public bool IsCover { get; set; }
    public int SortOrder { get; set; }

    // Processing status for background variant generation
    public PhotoProcessingStatus ProcessingStatus { get; set; } = PhotoProcessingStatus.Processing;
    public string? ProcessingError { get; set; }

    // Image variants (WebP optimized)
    public string? ThumbnailUrl { get; set; }   // 300px max
    public string? MediumUrl { get; set; }       // 800px max
    public string? LargeUrl { get; set; }        // 1600px max
    public string? BlurHash { get; set; }        // Tiny base64 placeholder

    // Storage keys for variants (for cleanup)
    public string? ThumbnailStorageKey { get; set; }
    public string? MediumStorageKey { get; set; }
    public string? LargeStorageKey { get; set; }

    // Original uploaded photo (preserved in original format)
    public string? OriginalStorageKey { get; set; }
    public string? OriginalUrl { get; set; }
    public string? OriginalMimeType { get; set; }
    public long? OriginalFileSizeBytes { get; set; }

    // Navigation properties
    public virtual Inventory Inventory { get; set; } = null!;
    public virtual InventorySpecimen? InventorySpecimen { get; set; }
}
