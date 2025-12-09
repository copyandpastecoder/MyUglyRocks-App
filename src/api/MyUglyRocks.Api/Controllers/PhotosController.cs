using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PhotosController : ControllerBase
{
    private readonly DbContext _context;
    private readonly IStorageService _storageService;
    private readonly ILogger<PhotosController> _logger;

    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    public PhotosController(
        DbContext context,
        IStorageService storageService,
        ILogger<PhotosController> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    private DbSet<Photo> Photos => _context.Set<Photo>();
    private DbSet<StageRun> StageRuns => _context.Set<StageRun>();
    private DbSet<Cycle> Cycles => _context.Set<Cycle>();

    /// <summary>
    /// Upload a photo to a stage run
    /// </summary>
    [HttpPost("stage/{stageRunId}")]
    [ProducesResponseType(typeof(UploadPhotoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UploadPhotoResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadStagePhoto(
        Guid stageRunId,
        [FromForm] IFormFile file,
        [FromForm] string photoType = "during",
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
            .FirstOrDefaultAsync(s => s.Id == stageRunId && !s.IsDeleted, cancellationToken);

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
            // Upload to R2
            var folder = $"photos/stages/{stageRunId}";
            await using var stream = file.OpenReadStream();
            var url = await _storageService.UploadAsync(stream, file.FileName, folder, cancellationToken);

            // Get the storage key from the URL
            var storageKey = url.Split('/').Skip(3).Aggregate((a, b) => $"{a}/{b}");

            // Create photo record
            var sortOrder = stageRun.Photos.Count;
            var photo = new Photo
            {
                Id = Guid.NewGuid(),
                StageRunId = stageRunId,
                StorageKey = storageKey,
                Url = url,
                FileName = file.FileName,
                MimeType = file.ContentType,
                FileSizeBytes = file.Length,
                PhotoType = parsedPhotoType,
                SortOrder = sortOrder,
                DateCreated = DateTime.UtcNow,
                DateUpdated = DateTime.UtcNow
            };

            await Photos.AddAsync(photo, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Photo uploaded for stage {StageRunId}: {PhotoId}", stageRunId, photo.Id);

            var dto = new PhotoDto(
                photo.Id,
                photo.Url,
                photo.FileName,
                photo.PhotoType.ToString(),
                photo.SortOrder,
                photo.DateCreated
            );

            return Ok(new UploadPhotoResponse(true, dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload photo for stage {StageRunId}", stageRunId);
            return BadRequest(new UploadPhotoResponse(false, Error: "Failed to upload photo"));
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
            .FirstOrDefaultAsync(p => p.Id == photoId && !p.IsDeleted, cancellationToken);

        if (photo == null)
        {
            return NotFound();
        }

        if (photo.StageRun.Cycle.UserId != userId)
        {
            return Forbid();
        }

        // Delete from storage
        try
        {
            await _storageService.DeleteAsync(photo.StorageKey, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete photo from storage: {StorageKey}", photo.StorageKey);
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
            .FirstOrDefaultAsync(s => s.Id == stageRunId && !s.IsDeleted, cancellationToken);

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
                p.Id,
                p.Url,
                p.FileName,
                p.PhotoType.ToString(),
                p.SortOrder,
                p.DateCreated
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
            .FirstOrDefaultAsync(s => s.Id == stageRunId && !s.IsDeleted, cancellationToken);

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
            var photo = stageRun.Photos.FirstOrDefault(p => p.Id == request.PhotoIds[i]);
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
