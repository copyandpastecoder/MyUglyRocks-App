using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Api.Helpers;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin,Moderator")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IReferenceDataService _referenceDataService;
    private readonly ISessionAnalyticsService _sessionAnalyticsService;
    private readonly IDatabaseBackupService _databaseBackupService;

    public AdminController(
        IAdminService adminService,
        IReferenceDataService referenceDataService,
        ISessionAnalyticsService sessionAnalyticsService,
        IDatabaseBackupService databaseBackupService)
    {
        _adminService = adminService;
        _referenceDataService = referenceDataService;
        _sessionAnalyticsService = sessionAnalyticsService;
        _databaseBackupService = databaseBackupService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool IsAdmin()
    {
        return User.IsInRole("Admin");
    }

    #region Dashboard

    /// <summary>
    /// Get admin dashboard statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminStatsDto>> GetStats()
    {
        var stats = await _adminService.GetStatsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Get browser/device analytics for admin dashboard
    /// </summary>
    [HttpGet("browser-stats")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(BrowserStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BrowserStatsDto>> GetBrowserStats(
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        var stats = await _sessionAnalyticsService.GetBrowserStatsAsync(days, cancellationToken);
        return Ok(stats);
    }

    #endregion

    #region Comment Reports

    /// <summary>
    /// Get list of comment reports (moderation queue)
    /// </summary>
    [HttpGet("reports")]
    [ProducesResponseType(typeof(PaginatedResult<CommentReportListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResult<CommentReportListDto>>> GetReports(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Validate pagination parameters to prevent resource exhaustion
        page = PaginationHelper.ClampPage(page);
        pageSize = PaginationHelper.ClampPageSize(pageSize);

        var reports = await _adminService.GetReportsAsync(status, page, pageSize);
        return Ok(reports);
    }

    /// <summary>
    /// Get a specific comment report
    /// </summary>
    [HttpGet("reports/{reportId:guid}")]
    [ProducesResponseType(typeof(CommentReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommentReportDto>> GetReport(Guid reportId)
    {
        var report = await _adminService.GetReportByIdAsync(reportId);
        if (report == null) return NotFound();
        return Ok(report);
    }

    /// <summary>
    /// Resolve a comment report
    /// </summary>
    [HttpPut("reports/{reportId:guid}")]
    [ProducesResponseType(typeof(CommentReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommentReportDto>> ResolveReport(
        Guid reportId,
        [FromBody] ResolveReportRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var report = await _adminService.ResolveReportAsync(reportId, userId.Value, request);
            return Ok(report);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Report not found" });
        }
    }

    /// <summary>
    /// Delete a comment (admin action)
    /// </summary>
    [HttpDelete("comments/{commentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            await _adminService.DeleteCommentAsync(commentId, userId.Value);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Comment not found" });
        }
    }

    #endregion

    #region User Management

    /// <summary>
    /// Get list of users (admin only)
    /// </summary>
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PaginatedResult<AdminUserListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResult<AdminUserListDto>>> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Validate pagination parameters to prevent resource exhaustion
        page = PaginationHelper.ClampPage(page);
        pageSize = PaginationHelper.ClampPageSize(pageSize);

        var users = await _adminService.GetUsersAsync(search, role, isActive, page, pageSize);
        return Ok(users);
    }

    /// <summary>
    /// Get a specific user details (admin only)
    /// </summary>
    [HttpGet("users/{userId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserDto>> GetUser(Guid userId)
    {
        var user = await _adminService.GetUserByIdAsync(userId);
        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Create a new user (admin only). The user must use "Forgot Password" to set their password.
    /// </summary>
    [HttpPost("users")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _adminService.CreateUserAsync(request);
            return CreatedAtAction(nameof(GetUser), new { userId = user.UserId }, user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Change a user's role (admin only)
    /// </summary>
    [HttpPut("users/{userId:guid}/role")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserDto>> ChangeUserRole(
        Guid userId,
        [FromBody] ChangeUserRoleRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue) return Unauthorized();

        try
        {
            var user = await _adminService.ChangeUserRoleAsync(userId, currentUserId.Value, request);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Ban a user (admin only)
    /// </summary>
    [HttpPut("users/{userId:guid}/ban")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BanUser(
        Guid userId,
        [FromBody] BanUserRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue) return Unauthorized();

        try
        {
            await _adminService.BanUserAsync(userId, currentUserId.Value, request);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Unban a user (admin only)
    /// </summary>
    [HttpPut("users/{userId:guid}/unban")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnbanUser(Guid userId)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue) return Unauthorized();

        try
        {
            await _adminService.UnbanUserAsync(userId, currentUserId.Value);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "User not found" });
        }
    }

    #endregion

    #region Specimen Management

    /// <summary>
    /// Get list of specimens (admin - includes inactive)
    /// </summary>
    [HttpGet("specimens")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PaginatedResult<SpecimenListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResult<SpecimenListDto>>> GetSpecimens(
        [FromQuery] string? search = null,
        [FromQuery] string? materialType = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Validate pagination parameters to prevent resource exhaustion
        page = PaginationHelper.ClampPage(page);
        pageSize = PaginationHelper.ClampPageSize(pageSize);

        var specimens = await _referenceDataService.GetSpecimensPaginatedAsync(
            search, materialType, isActive, page, pageSize);
        return Ok(specimens);
    }

    /// <summary>
    /// Create a new specimen (admin only)
    /// </summary>
    [HttpPost("specimens")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SpecimenDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SpecimenDetailDto>> CreateSpecimen(
        [FromBody] CreateSpecimenRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var specimen = await _referenceDataService.CreateSpecimenAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetSpecimen), new { specimenId = specimen.SpecimenId }, specimen);
    }

    /// <summary>
    /// Get a specific specimen (admin - includes inactive)
    /// </summary>
    [HttpGet("specimens/{specimenId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SpecimenDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SpecimenDetailDto>> GetSpecimen(Guid specimenId)
    {
        var specimen = await _referenceDataService.GetSpecimenByIdAsync(specimenId);
        if (specimen == null) return NotFound();
        return Ok(specimen);
    }

    /// <summary>
    /// Update a specimen (admin only)
    /// </summary>
    [HttpPut("specimens/{specimenId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SpecimenDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SpecimenDetailDto>> UpdateSpecimen(
        Guid specimenId,
        [FromBody] UpdateSpecimenRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var specimen = await _referenceDataService.UpdateSpecimenAsync(specimenId, request, userId.Value);
            return Ok(specimen);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Specimen not found" });
        }
    }

    /// <summary>
    /// Delete a specimen (soft delete - admin only)
    /// </summary>
    [HttpDelete("specimens/{specimenId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSpecimen(Guid specimenId)
    {
        try
        {
            await _referenceDataService.DeleteSpecimenAsync(specimenId);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Specimen not found" });
        }
    }

    #endregion

    #region Material Management

    /// <summary>
    /// Get list of materials (admin - includes inactive)
    /// </summary>
    [HttpGet("materials")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PaginatedResult<MaterialListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResult<MaterialListDto>>> GetMaterials(
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Validate pagination parameters to prevent resource exhaustion
        page = PaginationHelper.ClampPage(page);
        pageSize = PaginationHelper.ClampPageSize(pageSize);

        var materials = await _referenceDataService.GetMaterialsPaginatedAsync(
            search, category, isActive, page, pageSize);
        return Ok(materials);
    }

    /// <summary>
    /// Create a new material (admin only)
    /// </summary>
    [HttpPost("materials")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MaterialDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MaterialDetailDto>> CreateMaterial(
        [FromBody] CreateMaterialRequest request)
    {
        var material = await _referenceDataService.CreateMaterialAsync(request);
        return CreatedAtAction(nameof(GetMaterial), new { materialId = material.MaterialId }, material);
    }

    /// <summary>
    /// Get a specific material (admin - includes inactive)
    /// </summary>
    [HttpGet("materials/{materialId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MaterialDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaterialDetailDto>> GetMaterial(Guid materialId)
    {
        var material = await _referenceDataService.GetMaterialByIdAsync(materialId);
        if (material == null) return NotFound();
        return Ok(material);
    }

    /// <summary>
    /// Update a material (admin only)
    /// </summary>
    [HttpPut("materials/{materialId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MaterialDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaterialDetailDto>> UpdateMaterial(
        Guid materialId,
        [FromBody] UpdateMaterialRequest request)
    {
        try
        {
            var material = await _referenceDataService.UpdateMaterialAsync(materialId, request);
            return Ok(material);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Material not found" });
        }
    }

    /// <summary>
    /// Delete a material (soft delete - admin only)
    /// </summary>
    [HttpDelete("materials/{materialId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMaterial(Guid materialId)
    {
        try
        {
            await _referenceDataService.DeleteMaterialAsync(materialId);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Material not found" });
        }
    }

    #endregion

    #region Database Backup

    /// <summary>
    /// List available database backups (admin only)
    /// </summary>
    [HttpGet("backups")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<BackupInfo>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BackupInfo>>> ListBackups(
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        // Clamp limit to prevent excessive listing
        limit = Math.Clamp(limit, 1, 100);
        var backups = await _databaseBackupService.ListBackupsAsync(limit, cancellationToken);
        return Ok(backups);
    }

    /// <summary>
    /// Get the most recent backup info (admin only)
    /// </summary>
    [HttpGet("backups/latest")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(BackupInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BackupInfo>> GetLatestBackup(CancellationToken cancellationToken = default)
    {
        var backup = await _databaseBackupService.GetLastBackupAsync(cancellationToken);
        if (backup == null)
        {
            return NotFound(new { message = "No backups found" });
        }
        return Ok(backup);
    }

    /// <summary>
    /// Create a manual database backup (admin only)
    /// </summary>
    [HttpPost("backups")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(BackupResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BackupResult>> CreateBackup(CancellationToken cancellationToken = default)
    {
        var result = await _databaseBackupService.CreateBackupAsync(BackupType.Manual, cancellationToken);

        if (!result.Success && result.ErrorMessage?.Contains("Another backup/restore operation") == true)
        {
            return Conflict(new { message = result.ErrorMessage });
        }

        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(result);
    }

    /// <summary>
    /// Validate a backup's integrity (admin only).
    /// Pass the backup key in the request body since keys contain slashes.
    /// </summary>
    [HttpPost("backups/validate")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ValidationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ValidationResult>> ValidateBackup(
        [FromBody] ValidateRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.BackupKey))
        {
            return BadRequest(new { message = "BackupKey is required" });
        }

        var result = await _databaseBackupService.ValidateBackupAsync(request.BackupKey, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Restore database from a backup (admin only).
    /// DANGEROUS: This replaces the current database with backup data.
    /// A pre-restore safety backup is created automatically.
    /// </summary>
    [HttpPost("backups/restore")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(RestoreResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RestoreResult>> RestoreBackup(
        [FromBody] RestoreRequest request,
        CancellationToken cancellationToken = default)
    {
        // Require explicit confirmation to prevent accidental restores
        if (request.Confirmation != "RESTORE")
        {
            return BadRequest(new { message = "Confirmation must be 'RESTORE' to proceed" });
        }

        if (string.IsNullOrWhiteSpace(request.BackupKey))
        {
            return BadRequest(new { message = "BackupKey is required" });
        }

        var result = await _databaseBackupService.RestoreAsync(
            request.BackupKey,
            createPreRestoreBackup: true,
            useSingleTransaction: true,
            cancellationToken);

        if (!result.Success && result.ErrorMessage?.Contains("Another backup/restore operation") == true)
        {
            return Conflict(new { message = result.ErrorMessage });
        }

        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(result);
    }

    #endregion
}
