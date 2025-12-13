using System.Security.Claims;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Jobs;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PhotosController : ControllerBase
{
    private readonly DbContext _context;
    private readonly IStorageService _storageService;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<PhotosController> _logger;

    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    public PhotosController(
        DbContext context,
        IStorageService storageService,
        IBackgroundJobClient backgroundJobClient,
        ILogger<PhotosController> logger)
    {
        _context = context;
        _storageService = storageService;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    private DbSet<Photo> Photos => _context.Set<Photo>();
    private DbSet<StageRun> StageRuns => _context.Set<StageRun>();
    private DbSet<Cycle> Cycles => _context.Set<Cycle>();

    /// <summary>
    /// Upload a photo to a stage run
    /// </summary>
    [HttpPost("stage/{stageRunId}")]
    [EnableRateLimiting("intensive")]
    [ProducesResponseType(typeof(UploadPhotoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UploadPhotoResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadStagePhoto(
        Guid stageRunId,
        [FromForm] IFormFile file,
        [FromForm] string photoType = "during",
        [FromForm] string? caption = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new UploadPhotoResponse(false, Error: "No file provided"));
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new UploadPhotoResponse(false, Error: $"File type not allowed. Allowed: {string.Join(", ", AllowedExtensions)}"));
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new UploadPhotoResponse(false, Error: "File size exceeds 10 MB limit"));
        }

        // Verify stage run exists and belongs to user
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.Photos.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && !s.IsDeleted, cancellationToken);

        if (stageRun == null)
        {
            return NotFound(new UploadPhotoResponse(false, Error: "Stage run not found"));
        }

        if (stageRun.Cycle.UserId != userId)
        {
            return Forbid();
        }

        // Check storage is configured
        if (!_storageService.IsConfigured)
        {
            return BadRequest(new UploadPhotoResponse(false, Error: "Photo storage is not configured"));
        }

        // Parse photo type
        if (!Enum.TryParse<PhotoType>(photoType, true, out var parsedPhotoType))
        {
            parsedPhotoType = PhotoType.During;
        }

        try
        {
            _logger.LogDebug("Starting photo upload for stage {StageRunId}, extension: {Extension}, size: {Size}",
                stageRunId, PiiMaskingHelper.SanitizeForLog(extension), file.Length);

            var photoId = Guid.NewGuid();
            var folder = $"photos/stages/{stageRunId}";
            var baseKey = $"{DateTime.UtcNow:yyyyMMdd}-{photoId:N}";

            // Read file into memory for background processing
            byte[] imageData;
            await using (var inputStream = file.OpenReadStream())
            {
                using var memoryStream = new MemoryStream();
                await inputStream.CopyToAsync(memoryStream, cancellationToken);
                imageData = memoryStream.ToArray();
            }

            // Create photo record immediately with "Processing" status
            var sortOrder = stageRun.Photos.Count;
            var photo = new Photo
            {
                PhotoId = photoId,
                StageRunId = stageRunId,
                StorageKey = $"{folder}/{baseKey}-original.webp",  // Placeholder, updated by job
                Url = "",  // Will be set by background job
                FileName = $"{photoId:N}{extension}",
                MimeType = "image/webp",
                FileSizeBytes = file.Length,
                PhotoType = parsedPhotoType,
                Caption = caption,
                SortOrder = sortOrder,
                ProcessingStatus = PhotoProcessingStatus.Processing,
                DateCreated = DateTime.UtcNow,
                DateUpdated = DateTime.UtcNow
            };

            await Photos.AddAsync(photo, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Enqueue background job for image processing (variants + upload)
            _backgroundJobClient.Enqueue<PhotoProcessingJob>(
                job => job.ProcessPhotoAsync(photoId, imageData, file.FileName));

            _logger.LogInformation("Photo {PhotoId} queued for background processing", photoId);

            var dto = new PhotoDto(
                photo.PhotoId,
                photo.Url,
                photo.FileName,
                photo.PhotoType.ToString(),
                photo.Caption,
                photo.SortOrder,
                photo.DateCreated,
                photo.ThumbnailUrl,
                photo.MediumUrl,
                photo.LargeUrl,
                photo.BlurHash,
                photo.Width,
                photo.Height,
                photo.ProcessingStatus.ToString(),
                photo.ProcessingError
            );

            return Ok(new UploadPhotoResponse(true, dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload photo for stage {StageRunId}: {Message}", stageRunId, ex.Message);
            return BadRequest(new UploadPhotoResponse(false, Error: $"Failed to upload photo: {ex.Message}"));
        }
    }

    /// <summary>
    /// Delete a photo
    /// </summary>
    [HttpDelete("{photoId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePhoto(Guid photoId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var photo = await Photos
            .Include(p => p.StageRun)
                .ThenInclude(s => s.Cycle)
            .FirstOrDefaultAsync(p => p.PhotoId == photoId && !p.IsDeleted, cancellationToken);

        if (photo == null)
        {
            return NotFound();
        }

        if (photo.StageRun.Cycle.UserId != userId)
        {
            return Forbid();
        }

        // Delete all variants from storage
        try
        {
            var keysToDelete = new List<string> { photo.StorageKey };
            if (!string.IsNullOrEmpty(photo.ThumbnailStorageKey))
                keysToDelete.Add(photo.ThumbnailStorageKey);
            if (!string.IsNullOrEmpty(photo.MediumStorageKey))
                keysToDelete.Add(photo.MediumStorageKey);
            if (!string.IsNullOrEmpty(photo.LargeStorageKey))
                keysToDelete.Add(photo.LargeStorageKey);

            await _storageService.DeleteManyAsync(keysToDelete, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete photo variants from storage: {StorageKey}", PiiMaskingHelper.SanitizeForLog(photo.StorageKey));
        }

        // Soft delete the record
        photo.IsDeleted = true;
        photo.DateUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Photo deleted: {PhotoId}", photoId);

        return Ok(new { message = "Photo deleted" });
    }

    /// <summary>
    /// Get all photos for a stage run
    /// </summary>
    [HttpGet("stage/{stageRunId}")]
    [ProducesResponseType(typeof(List<PhotoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStagePhotos(Guid stageRunId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.Photos.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && !s.IsDeleted, cancellationToken);

        if (stageRun == null)
        {
            return NotFound();
        }

        if (stageRun.Cycle.UserId != userId)
        {
            return Forbid();
        }

        var photos = stageRun.Photos
            .OrderBy(p => p.SortOrder)
            .Select(p => new PhotoDto(
                p.PhotoId,
                p.Url,
                p.FileName,
                p.PhotoType.ToString(),
                p.Caption,
                p.SortOrder,
                p.DateCreated,
                p.ThumbnailUrl,
                p.MediumUrl,
                p.LargeUrl,
                p.BlurHash,
                p.Width,
                p.Height,
                p.ProcessingStatus.ToString(),
                p.ProcessingError
            ))
            .ToList();

        return Ok(photos);
    }

    /// <summary>
    /// Reorder photos for a stage run
    /// </summary>
    [HttpPut("stage/{stageRunId}/reorder")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReorderPhotos(
        Guid stageRunId,
        [FromBody] ReorderPhotosRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.Photos.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && !s.IsDeleted, cancellationToken);

        if (stageRun == null)
        {
            return NotFound();
        }

        if (stageRun.Cycle.UserId != userId)
        {
            return Forbid();
        }

        // Update sort orders
        for (int i = 0; i < request.PhotoIds.Count; i++)
        {
            var photo = stageRun.Photos.FirstOrDefault(p => p.PhotoId == request.PhotoIds[i]);
            if (photo != null)
            {
                photo.SortOrder = i;
                photo.DateUpdated = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Photos reordered" });
    }

    /// <summary>
    /// Check if storage is configured
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetStorageStatus()
    {
        return Ok(new { configured = _storageService.IsConfigured });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
