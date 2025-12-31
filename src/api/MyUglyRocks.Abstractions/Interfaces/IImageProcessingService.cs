namespace MyUglyRocks.Abstractions.Interfaces;

/// <summary>
/// Represents a processed image variant
/// </summary>
public record ImageVariant(
    string Size,       // "thumbnail", "medium", "large", "original"
    Stream Stream,
    int Width,
    int Height,
    string MimeType,
    string Extension
);

/// <summary>
/// Result of processing an image into multiple variants
/// </summary>
public record ProcessedImageResult(
    List<ImageVariant> Variants,
    int OriginalWidth,
    int OriginalHeight,
    string? BlurHash  // For lazy loading placeholder
);

/// <summary>
/// Result of thumbnail-only processing (phase 1)
/// </summary>
public record ThumbnailResult(
    ImageVariant Thumbnail,
    int OriginalWidth,
    int OriginalHeight,
    string? BlurHash
);

/// <summary>
/// Result of large variants processing (phase 2)
/// </summary>
public record LargeVariantsResult(
    List<ImageVariant> Variants  // large + original
);

/// <summary>
/// Result of original preservation (phase 3) - preserves original format without conversion
/// </summary>
public record OriginalPreservationResult(
    Stream Stream,
    string MimeType,
    string Extension,
    long FileSizeBytes
);

/// <summary>
/// Service for processing and resizing images
/// </summary>
public interface IImageProcessingService
{
    /// <summary>
    /// Process an image and generate multiple size variants
    /// </summary>
    /// <param name="inputStream">Original image stream</param>
    /// <param name="fileName">Original file name (for format detection)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Processed variants in different sizes</returns>
    Task<ProcessedImageResult> ProcessImageAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Phase 1: Process thumbnail only (fast, for immediate display)
    /// </summary>
    Task<ThumbnailResult> ProcessThumbnailAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Phase 2: Process large variants (background, user doesn't wait)
    /// </summary>
    Task<LargeVariantsResult> ProcessLargeVariantsAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Process an avatar image (square crop + resize)
    /// </summary>
    Task<ImageVariant> ProcessAvatarAsync(
        Stream inputStream,
        string fileName,
        int size = 256,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Phase 3: Preserve original uploaded photo without any conversion or processing
    /// </summary>
    Task<OriginalPreservationResult> PreserveOriginalAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default);
}
