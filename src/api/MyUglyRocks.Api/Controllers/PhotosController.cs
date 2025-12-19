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
    private DbSet<Inventory> Inventory => _context.Set<Inventory>();
    private DbSet<InventoryPhoto> InventoryPhotos => _context.Set<InventoryPhoto>();

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

            // Upload to R2 temp storage first - avoids storing large byte arrays in Hangfire
            var tempStorageKey = $"temp/{photoId:N}{extension}";
            await using (var inputStream = file.OpenReadStream())
            {
                await _storageService.UploadAsync(inputStream, file.FileName, "temp", $"{photoId:N}{extension}", cancellationToken);
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

            // Two-phase processing: thumbnail first (fast), then large variants (background)
            // Jobs fetch from R2 temp storage instead of receiving byte[] (prevents DB bloat)
            // Phase 1: Thumbnail - user sees this quickly, status becomes Completed
            var thumbnailJobId = _backgroundJobClient.Enqueue<PhotoProcessingJob>(
                job => job.ProcessThumbnailAsync(photoId, tempStorageKey, file.FileName));

            // Phase 2: Large variants - runs after thumbnail, user doesn't wait
            // This job also cleans up the temp file after processing
            _backgroundJobClient.ContinueJobWith<PhotoProcessingJob>(
                thumbnailJobId,
                job => job.ProcessLargeVariantsAsync(photoId, tempStorageKey, file.FileName));

            _logger.LogInformation("Photo {PhotoId} queued for two-phase processing, temp key: {TempKey}", photoId, tempStorageKey);

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
    /// Upload a photo to an inventory item
    /// </summary>
    [HttpPost("inventory/{inventoryId}")]
    [EnableRateLimiting("intensive")]
    [ProducesResponseType(typeof(UploadPhotoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UploadPhotoResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadInventoryPhoto(
        Guid inventoryId,
        [FromForm] IFormFile file,
        [FromForm] string? caption = null,
        [FromForm] bool isCover = false,
        [FromForm] Guid? inventorySpecimenId = null,
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

        // Verify inventory exists and belongs to user
        var inventory = await Inventory
            .Include(i => i.InventoryPhotos)
            .Include(i => i.InventorySpecimens)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && !i.IsDeleted, cancellationToken);

        if (inventory == null)
        {
            return NotFound(new UploadPhotoResponse(false, Error: "Inventory not found"));
        }

        if (inventory.UserId != userId)
        {
            return Forbid();
        }

        // Validate specimen belongs to this inventory
        if (inventorySpecimenId.HasValue)
        {
            var specimenExists = inventory.InventorySpecimens
                .Any(s => s.InventorySpecimenId == inventorySpecimenId.Value);
            if (!specimenExists)
            {
                return BadRequest(new UploadPhotoResponse(false, Error: "Specimen not found in this inventory"));
            }
        }

        // Check storage is configured
        if (!_storageService.IsConfigured)
        {
            return BadRequest(new UploadPhotoResponse(false, Error: "Photo storage is not configured"));
        }

        try
        {
            _logger.LogDebug("Starting inventory photo upload for inventory {InventoryId}, extension: {Extension}, size: {Size}",
                inventoryId, PiiMaskingHelper.SanitizeForLog(extension), file.Length);

            var photoId = Guid.NewGuid();
            var folder = $"photos/inventory/{inventoryId}";
            var baseKey = $"{DateTime.UtcNow:yyyyMMdd}-{photoId:N}";

            // Upload to R2 temp storage first - avoids storing large byte arrays in Hangfire
            var tempStorageKey = $"temp/{photoId:N}{extension}";
            await using (var inputStream = file.OpenReadStream())
            {
                await _storageService.UploadAsync(inputStream, file.FileName, "temp", $"{photoId:N}{extension}", cancellationToken);
            }

            // If this is set as cover, unset existing cover
            if (isCover)
            {
                foreach (var existingPhoto in inventory.InventoryPhotos.Where(p => p.IsCover))
                {
                    existingPhoto.IsCover = false;
                }
            }

            // Create photo record immediately with "Processing" status
            var sortOrder = inventory.InventoryPhotos.Count;
            var photo = new InventoryPhoto
            {
                InventoryPhotoId = photoId,
                InventoryId = inventoryId,
                InventorySpecimenId = inventorySpecimenId,
                StorageKey = $"{folder}/{baseKey}-original.webp",  // Placeholder, updated by job
                Url = "",  // Will be set by background job
                FileName = $"{photoId:N}{extension}",
                MimeType = "image/webp",
                FileSizeBytes = file.Length,
                Caption = caption,
                IsCover = isCover || inventory.InventoryPhotos.Count == 0, // First photo is auto-cover
                SortOrder = sortOrder,
                ProcessingStatus = PhotoProcessingStatus.Processing,
                DateCreated = DateTime.UtcNow,
                DateUpdated = DateTime.UtcNow
            };

            await InventoryPhotos.AddAsync(photo, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Two-phase processing: thumbnail first (fast), then large variants (background)
            // Jobs fetch from R2 temp storage instead of receiving byte[] (prevents DB bloat)
            // Phase 1: Thumbnail - user sees this quickly, status becomes Completed
            var thumbnailJobId = _backgroundJobClient.Enqueue<InventoryPhotoProcessingJob>(
                job => job.ProcessThumbnailAsync(photoId, tempStorageKey, file.FileName));

            // Phase 2: Large variants - runs after thumbnail, user doesn't wait
            // This job also cleans up the temp file after processing
            _backgroundJobClient.ContinueJobWith<InventoryPhotoProcessingJob>(
                thumbnailJobId,
                job => job.ProcessLargeVariantsAsync(photoId, tempStorageKey, file.FileName));

            _logger.LogInformation("Inventory photo {PhotoId} queued for two-phase processing, temp key: {TempKey}", photoId, tempStorageKey);

            var dto = new InventoryPhotoDto(
                photo.InventoryPhotoId,
                photo.Url,
                photo.FileName,
                photo.Caption,
                photo.IsCover,
                photo.SortOrder,
                photo.DateCreated,
                photo.ThumbnailUrl,
                photo.MediumUrl,
                photo.LargeUrl,
                photo.BlurHash,
                photo.Width,
                photo.Height,
                photo.ProcessingStatus.ToString(),
                photo.ProcessingError,
                photo.InventorySpecimenId,
                null // Specimen name will be populated on next fetch
            );

            return Ok(new UploadInventoryPhotoResponse(true, dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload photo for inventory {InventoryId}: {Message}", inventoryId, ex.Message);
            return BadRequest(new UploadPhotoResponse(false, Error: $"Failed to upload photo: {ex.Message}"));
        }
    }

    /// <summary>
    /// Delete an inventory photo
    /// </summary>
    [HttpDelete("inventory/{photoId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteInventoryPhoto(Guid photoId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var photo = await InventoryPhotos
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.InventoryPhotoId == photoId, cancellationToken);

        if (photo == null)
        {
            return NotFound();
        }

        if (photo.Inventory.UserId != userId)
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
            _logger.LogWarning(ex, "Failed to delete inventory photo variants from storage: {StorageKey}", PiiMaskingHelper.SanitizeForLog(photo.StorageKey));
        }

        // Hard delete the record (inventory photos don't use soft delete)
        InventoryPhotos.Remove(photo);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Inventory photo deleted: {PhotoId}", photoId);

        return Ok(new { message = "Photo deleted" });
    }

    /// <summary>
    /// Get all photos for an inventory item
    /// </summary>
    [HttpGet("inventory/{inventoryId}")]
    [ProducesResponseType(typeof(List<InventoryPhotoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventoryPhotos(Guid inventoryId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var inventory = await Inventory
            .Include(i => i.InventoryPhotos)
            .Include(i => i.InventorySpecimens)
                .ThenInclude(s => s.Specimen)
            .Include(i => i.InventorySpecimens)
                .ThenInclude(s => s.UserSpecimen)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && !i.IsDeleted, cancellationToken);

        if (inventory == null)
        {
            return NotFound();
        }

        if (inventory.UserId != userId)
        {
            return Forbid();
        }

        var photos = inventory.InventoryPhotos
            .OrderBy(p => p.SortOrder)
            .Select(p => {
                string? specimenName = null;
                if (p.InventorySpecimenId.HasValue)
                {
                    var linkedSpecimen = inventory.InventorySpecimens
                        .FirstOrDefault(s => s.InventorySpecimenId == p.InventorySpecimenId);
                    if (linkedSpecimen != null)
                    {
                        specimenName = linkedSpecimen.Specimen?.CommonName
                            ?? linkedSpecimen.UserSpecimen?.CommonName;
                    }
                }
                return new InventoryPhotoDto(
                    p.InventoryPhotoId,
                    p.Url,
                    p.FileName,
                    p.Caption,
                    p.IsCover,
                    p.SortOrder,
                    p.DateCreated,
                    p.ThumbnailUrl,
                    p.MediumUrl,
                    p.LargeUrl,
                    p.BlurHash,
                    p.Width,
                    p.Height,
                    p.ProcessingStatus.ToString(),
                    p.ProcessingError,
                    p.InventorySpecimenId,
                    specimenName
                );
            })
            .ToList();

        return Ok(photos);
    }

    /// <summary>
    /// Set cover photo for an inventory item
    /// </summary>
    [HttpPut("inventory/{inventoryId}/cover/{photoId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetInventoryCoverPhoto(Guid inventoryId, Guid photoId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var inventory = await Inventory
            .Include(i => i.InventoryPhotos)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && !i.IsDeleted, cancellationToken);

        if (inventory == null)
        {
            return NotFound();
        }

        if (inventory.UserId != userId)
        {
            return Forbid();
        }

        var targetPhoto = inventory.InventoryPhotos.FirstOrDefault(p => p.InventoryPhotoId == photoId);
        if (targetPhoto == null)
        {
            return NotFound(new { error = "Photo not found in this inventory" });
        }

        // Unset all covers and set the new one
        foreach (var photo in inventory.InventoryPhotos)
        {
            photo.IsCover = photo.InventoryPhotoId == photoId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Cover photo updated" });
    }

    /// <summary>
    /// Update an inventory photo's specimen tag and/or caption
    /// </summary>
    [HttpPut("inventory/{photoId}")]
    [ProducesResponseType(typeof(InventoryPhotoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateInventoryPhoto(
        Guid photoId,
        [FromBody] UpdateInventoryPhotoRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var photo = await InventoryPhotos
            .Include(p => p.Inventory)
                .ThenInclude(i => i.InventorySpecimens)
                    .ThenInclude(s => s.Specimen)
            .Include(p => p.Inventory)
                .ThenInclude(i => i.InventorySpecimens)
                    .ThenInclude(s => s.UserSpecimen)
            .FirstOrDefaultAsync(p => p.InventoryPhotoId == photoId, cancellationToken);

        if (photo == null)
        {
            return NotFound();
        }

        if (photo.Inventory.UserId != userId)
        {
            return Forbid();
        }

        // Validate specimen belongs to this inventory (if provided)
        if (request.InventorySpecimenId.HasValue)
        {
            var specimenExists = photo.Inventory.InventorySpecimens
                .Any(s => s.InventorySpecimenId == request.InventorySpecimenId.Value);
            if (!specimenExists)
            {
                return BadRequest(new { error = "Specimen not found in this inventory" });
            }
        }

        // Update fields
        photo.InventorySpecimenId = request.InventorySpecimenId;
        photo.Caption = request.Caption;
        photo.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Get specimen name for response
        string? specimenName = null;
        if (photo.InventorySpecimenId.HasValue)
        {
            var linkedSpecimen = photo.Inventory.InventorySpecimens
                .FirstOrDefault(s => s.InventorySpecimenId == photo.InventorySpecimenId);
            if (linkedSpecimen != null)
            {
                specimenName = linkedSpecimen.Specimen?.CommonName
                    ?? linkedSpecimen.UserSpecimen?.CommonName;
            }
        }

        var dto = new InventoryPhotoDto(
            photo.InventoryPhotoId,
            photo.Url,
            photo.FileName,
            photo.Caption,
            photo.IsCover,
            photo.SortOrder,
            photo.DateCreated,
            photo.ThumbnailUrl,
            photo.MediumUrl,
            photo.LargeUrl,
            photo.BlurHash,
            photo.Width,
            photo.Height,
            photo.ProcessingStatus.ToString(),
            photo.ProcessingError,
            photo.InventorySpecimenId,
            specimenName
        );

        _logger.LogInformation("Inventory photo {PhotoId} updated", photoId);

        return Ok(dto);
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
    /// Update a stage photo's caption and/or photo type
    /// </summary>
    [HttpPut("{photoId}")]
    [ProducesResponseType(typeof(PhotoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateStagePhoto(
        Guid photoId,
        [FromBody] UpdateStagePhotoRequest request,
        CancellationToken cancellationToken)
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

        // Update caption if provided
        if (request.Caption != null)
        {
            photo.Caption = request.Caption;
        }

        // Update photo type if provided
        if (!string.IsNullOrEmpty(request.PhotoType))
        {
            if (Enum.TryParse<PhotoType>(request.PhotoType, true, out var parsedPhotoType))
            {
                photo.PhotoType = parsedPhotoType;
            }
            else
            {
                return BadRequest(new { error = "Invalid photo type. Must be 'before', 'during', 'after', or 'inventory'." });
            }
        }

        photo.DateUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

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

        _logger.LogInformation("Stage photo {PhotoId} updated", photoId);

        return Ok(dto);
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
