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

    // Size presets for photo variants
    private static readonly (string Name, int MaxWidth, int MaxHeight)[] PhotoSizes =
    [
        ("thumbnail", 300, 300),
        ("medium", 800, 800),
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

        var variants = new List<ImageVariant>();

        // Generate each size variant
        foreach (var (sizeName, maxWidth, maxHeight) in PhotoSizes)
        {
            var variant = await CreateVariantAsync(image, sizeName, maxWidth, maxHeight, cancellationToken);
            variants.Add(variant);
        }

        // Also save the original as WebP (unless it's already smaller than large)
        if (originalWidth > PhotoSizes[^1].MaxWidth || originalHeight > PhotoSizes[^1].MaxHeight)
        {
            var originalVariant = await CreateVariantAsync(image, "original", originalWidth, originalHeight, cancellationToken);
            variants.Add(originalVariant);
        }
        else
        {
            // Original is small enough, just convert to WebP
            var originalVariant = await CreateVariantAsync(image, "original", originalWidth, originalHeight, cancellationToken);
            variants.Add(originalVariant);
        }

        // Generate blur hash (simplified base64 of tiny thumbnail)
        var blurHash = await GenerateBlurHashAsync(image, cancellationToken);

        _logger.LogInformation("Processed image into {Count} variants: {Sizes}",
            variants.Count, string.Join(", ", variants.Select(v => $"{v.Size}:{v.Width}x{v.Height}")));

        return new ProcessedImageResult(variants, originalWidth, originalHeight, blurHash);
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
            Quality = sizeName == "thumbnail" ? 75 : 85,  // Slightly lower quality for thumbnails
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
