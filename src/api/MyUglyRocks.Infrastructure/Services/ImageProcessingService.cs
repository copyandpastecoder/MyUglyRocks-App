using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace MyUglyRocks.Infrastructure.Services;

public class ImageProcessingService : IImageProcessingService
{
    private readonly ILogger<ImageProcessingService> _logger;

    // Size presets for photo variants (thumbnail for grids, large for lightbox)
    private static readonly (string Name, int MaxWidth, int MaxHeight)[] PhotoSizes =
    [
        ("thumbnail", 300, 300),
        ("large", 1600, 1600)
    ];

    public ImageProcessingService(ILogger<ImageProcessingService> logger)
    {
        _logger = logger;
    }

    public async Task<ProcessedImageResult> ProcessImageAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        // Load the image
        using var image = await Image.LoadAsync(inputStream, cancellationToken);
        var originalWidth = image.Width;
        var originalHeight = image.Height;

        _logger.LogDebug("Processing image {FileName}: {Width}x{Height}",
            PiiMaskingHelper.SanitizeForLog(fileName), originalWidth, originalHeight);

        // Build list of variants to create (including original if larger than large size)
        var variantSpecs = PhotoSizes.ToList();
        if (originalWidth > PhotoSizes[^1].MaxWidth || originalHeight > PhotoSizes[^1].MaxHeight)
        {
            variantSpecs.Add(("original", originalWidth, originalHeight));
        }
        else
        {
            variantSpecs.Add(("original", originalWidth, originalHeight));
        }

        // Process all variants in parallel for speed
        var variantTasks = variantSpecs.Select(spec =>
            CreateVariantAsync(image, spec.Name, spec.MaxWidth, spec.MaxHeight, cancellationToken));
        var variants = (await Task.WhenAll(variantTasks)).ToList();

        // Generate blur hash
        var blurHash = await GenerateBlurHashAsync(image, cancellationToken);

        _logger.LogInformation("Processed image into {Count} variants in parallel: {Sizes}",
            variants.Count, string.Join(", ", variants.Select(v => $"{v.Size}:{v.Width}x{v.Height}")));

        return new ProcessedImageResult(variants, originalWidth, originalHeight, blurHash);
    }

    public async Task<ThumbnailResult> ProcessThumbnailAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        using var image = await Image.LoadAsync(inputStream, cancellationToken);
        var originalWidth = image.Width;
        var originalHeight = image.Height;

        _logger.LogDebug("Processing thumbnail for {FileName}: {Width}x{Height}",
            PiiMaskingHelper.SanitizeForLog(fileName), originalWidth, originalHeight);

        // Create thumbnail only
        var thumbnail = await CreateVariantAsync(image, "thumbnail", 300, 300, cancellationToken);

        // Generate blur hash
        var blurHash = await GenerateBlurHashAsync(image, cancellationToken);

        _logger.LogInformation("Processed thumbnail: {Width}x{Height}", thumbnail.Width, thumbnail.Height);

        return new ThumbnailResult(thumbnail, originalWidth, originalHeight, blurHash);
    }

    public async Task<LargeVariantsResult> ProcessLargeVariantsAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        using var image = await Image.LoadAsync(inputStream, cancellationToken);
        var originalWidth = image.Width;
        var originalHeight = image.Height;

        _logger.LogDebug("Processing large variants for {FileName}: {Width}x{Height}",
            PiiMaskingHelper.SanitizeForLog(fileName), originalWidth, originalHeight);

        // Build list of large variants (large + original)
        var variantSpecs = new List<(string Name, int MaxWidth, int MaxHeight)>
        {
            ("large", 1600, 1600)
        };

        // Add original if larger than large size
        if (originalWidth > 1600 || originalHeight > 1600)
        {
            variantSpecs.Add(("original", originalWidth, originalHeight));
        }
        else
        {
            variantSpecs.Add(("original", originalWidth, originalHeight));
        }

        // Process in parallel
        var variantTasks = variantSpecs.Select(spec =>
            CreateVariantAsync(image, spec.Name, spec.MaxWidth, spec.MaxHeight, cancellationToken));
        var variants = (await Task.WhenAll(variantTasks)).ToList();

        _logger.LogInformation("Processed large variants: {Sizes}",
            string.Join(", ", variants.Select(v => $"{v.Size}:{v.Width}x{v.Height}")));

        return new LargeVariantsResult(variants);
    }

    public async Task<ImageVariant> ProcessAvatarAsync(
        Stream inputStream,
        string fileName,
        int size = 256,
        CancellationToken cancellationToken = default)
    {
        using var image = await Image.LoadAsync(inputStream, cancellationToken);

        _logger.LogDebug("Processing avatar {FileName}: {Width}x{Height} -> {TargetSize}",
            PiiMaskingHelper.SanitizeForLog(fileName), image.Width, image.Height, $"{size}x{size}");

        // Crop to square from center, then resize
        var minDimension = Math.Min(image.Width, image.Height);
        var cropX = (image.Width - minDimension) / 2;
        var cropY = (image.Height - minDimension) / 2;

        image.Mutate(ctx => ctx
            .Crop(new Rectangle(cropX, cropY, minDimension, minDimension))
            .Resize(size, size));

        // Encode as WebP
        var outputStream = new MemoryStream();
        await image.SaveAsync(outputStream, new WebpEncoder { Quality = 85 }, cancellationToken);
        outputStream.Position = 0;

        return new ImageVariant("avatar", outputStream, size, size, "image/webp", ".webp");
    }

    private async Task<ImageVariant> CreateVariantAsync(
        Image image,
        string sizeName,
        int maxWidth,
        int maxHeight,
        CancellationToken cancellationToken)
    {
        // Clone the image to avoid modifying the original
        using var clone = image.Clone(ctx =>
        {
            // Only resize if the image is larger than the target
            if (image.Width > maxWidth || image.Height > maxHeight)
            {
                ctx.Resize(new ResizeOptions
                {
                    Size = new Size(maxWidth, maxHeight),
                    Mode = ResizeMode.Max,  // Maintain aspect ratio, fit within bounds
                    Sampler = KnownResamplers.Lanczos3
                });
            }
        });

        // Encode as WebP for optimal file size
        var outputStream = new MemoryStream();
        var encoder = new WebpEncoder
        {
            Quality = sizeName == "thumbnail" ? 70 : 80,  // 70 for thumbnails, 80 for others
            FileFormat = WebpFileFormatType.Lossy
        };

        await clone.SaveAsync(outputStream, encoder, cancellationToken);
        outputStream.Position = 0;

        return new ImageVariant(
            sizeName,
            outputStream,
            clone.Width,
            clone.Height,
            "image/webp",
            ".webp"
        );
    }

    public async Task<OriginalPreservationResult> PreserveOriginalAsync(
        Stream inputStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Preserving original photo: {FileName}", PiiMaskingHelper.SanitizeForLog(fileName));

        // Copy the stream to a new MemoryStream (since the input stream may not support seeking)
        var memoryStream = new MemoryStream();
        await inputStream.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var mimeType = GetMimeTypeFromExtension(extension);

        _logger.LogInformation("Preserved original: {Extension}, {Size} bytes", extension, memoryStream.Length);

        return new OriginalPreservationResult(memoryStream, mimeType, extension, memoryStream.Length);
    }

    private static string GetMimeTypeFromExtension(string extension)
    {
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".heic" => "image/heic",
            ".heif" => "image/heif",
            _ => "application/octet-stream"
        };
    }

    private async Task<string?> GenerateBlurHashAsync(Image image, CancellationToken cancellationToken)
    {
        try
        {
            // Create a tiny version for blur placeholder (10x10)
            using var tiny = image.Clone(ctx => ctx.Resize(10, 10));

            var outputStream = new MemoryStream();
            await tiny.SaveAsync(outputStream, new WebpEncoder { Quality = 20 }, cancellationToken);

            // Return as base64 data URL for CSS background
            return $"data:image/webp;base64,{Convert.ToBase64String(outputStream.ToArray())}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate blur hash");
            return null;
        }
    }
}
