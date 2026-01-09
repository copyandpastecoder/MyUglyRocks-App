using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Abstractions.Helpers;

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
    private readonly IBackupStorageService _backupStorageService;
    private readonly IInvitationCodeService _invitationCodeService;
    private readonly IErrorLogService _errorLogService;
    private readonly IDemoAccountService _demoAccountService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IAdminService adminService,
        IReferenceDataService referenceDataService,
        ISessionAnalyticsService sessionAnalyticsService,
        IDatabaseBackupService databaseBackupService,
        IBackupStorageService backupStorageService,
        IInvitationCodeService invitationCodeService,
        IErrorLogService errorLogService,
        IDemoAccountService demoAccountService,
        ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _referenceDataService = referenceDataService;
        _sessionAnalyticsService = sessionAnalyticsService;
        _databaseBackupService = databaseBackupService;
        _backupStorageService = backupStorageService;
        _invitationCodeService = invitationCodeService;
        _errorLogService = errorLogService;
        _demoAccountService = demoAccountService;
        _logger = logger;
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

    /// <summary>
    /// Test file upload to backup bucket (admin only).
    /// Creates a simple text file to verify R2 backup bucket connectivity.
    /// </summary>
    [HttpPost("backups/test")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TestFileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TestFileResult>> TestBackupBucket(CancellationToken cancellationToken = default)
    {
        try
        {
            if (!_backupStorageService.IsConfigured)
            {
                return BadRequest(new { message = "Backup storage is not configured. Set R2:BackupBucketName in configuration." });
            }

            var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd-HH-mm-ss");
            var key = $"test/test-{timestamp}.txt";
            var content = $"Test file created at {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\nBackup bucket connectivity test successful.";
            
            var contentBytes = System.Text.Encoding.UTF8.GetBytes(content);
            using var stream = new MemoryStream(contentBytes);
            
            var metadata = new Dictionary<string, string>
            {
                ["test-timestamp"] = timestamp,
                ["test-type"] = "connectivity"
            };

            await _backupStorageService.UploadAsync(
                key, 
                stream, 
                "text/plain", 
                metadata, 
                cancellationToken);

            _logger.LogInformation("Test file uploaded successfully to backup bucket: {Key}", key);

            return Ok(new TestFileResult
            {
                Success = true,
                Key = key,
                Size = contentBytes.Length,
                Message = "Test file uploaded successfully to backup bucket"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload test file to backup bucket");
            return BadRequest(new { message = $"Test file upload failed: {ex.Message}" });
        }
    }

    #endregion

    #region Invitation Codes

    /// <summary>
    /// Generate one or more invitation codes (Admin only)
    /// </summary>
    [HttpPost("invitation-codes/generate")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<InvitationCodeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<InvitationCodeDto>>> GenerateInvitationCodes(
        [FromBody] CreateInvitationCodeRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var codes = await _invitationCodeService.GenerateCodesAsync(request, userId.Value, cancellationToken);
            return CreatedAtAction(nameof(GetInvitationCodes), codes);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all invitation codes with optional filtering (Admin only)
    /// </summary>
    [HttpGet("invitation-codes")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PaginatedInvitationCodesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedInvitationCodesResponse>> GetInvitationCodes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var result = await _invitationCodeService.GetCodesAsync(
            page, pageSize, status, search, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get a specific invitation code (Admin only)
    /// </summary>
    [HttpGet("invitation-codes/{codeId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(InvitationCodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvitationCodeDto>> GetInvitationCodeById(
        Guid codeId,
        CancellationToken cancellationToken = default)
    {
        var code = await _invitationCodeService.GetCodeByIdAsync(codeId, cancellationToken);
        if (code == null)
        {
            return NotFound();
        }

        return Ok(code);
    }

    /// <summary>
    /// Revoke an invitation code (Admin only)
    /// </summary>
    [HttpPost("invitation-codes/{codeId:guid}/revoke")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeInvitationCode(
        Guid codeId,
        [FromBody] RevokeInvitationCodeRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            await _invitationCodeService.RevokeCodeAsync(codeId, userId.Value, request.Reason, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to revoke code {CodeId}: {Error}", codeId, ex.Message);
            return NotFound();
        }
    }

    /// <summary>
    /// Get invitation code statistics (Admin only)
    /// </summary>
    [HttpGet("invitation-codes/stats")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(InvitationStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<InvitationStatsDto>> GetInvitationCodeStats(
        CancellationToken cancellationToken = default)
    {
        var stats = await _invitationCodeService.GetStatsAsync(cancellationToken);
        return Ok(stats);
    }

    #endregion

    #region Error Logs

    /// <summary>
    /// Get error logs with filtering and pagination (Admin only)
    /// </summary>
    [HttpGet("error-logs")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PaginatedResult<ErrorLogListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResult<ErrorLogListDto>>> GetErrorLogs(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] ErrorSeverity? severity,
        [FromQuery] Guid? userId,
        [FromQuery] string? searchPath,
        [FromQuery] string? searchCorrelationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _errorLogService.GetErrorLogsAsync(
            startDate, endDate, severity, userId, searchPath, searchCorrelationId,
            page, pageSize, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get error log detail by ID (Admin only)
    /// </summary>
    [HttpGet("error-logs/{errorLogId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ErrorLogDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ErrorLogDetailDto>> GetErrorLog(
        Guid errorLogId,
        CancellationToken cancellationToken = default)
    {
        var errorLog = await _errorLogService.GetErrorLogByIdAsync(errorLogId, cancellationToken);
        if (errorLog == null)
        {
            return NotFound();
        }
        return Ok(errorLog);
    }

    #endregion

    #region Demo Accounts

    /// <summary>
    /// Create a demo account with sample data (Admin only)
    /// </summary>
    [HttpPost("demo-accounts")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DemoAccountCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DemoAccountCreatedResponse>> CreateDemoAccount(
        [FromBody] CreateDemoAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        var adminId = GetCurrentUserId();
        if (!adminId.HasValue) return Unauthorized();

        try
        {
            var result = await _demoAccountService.CreateDemoAccountAsync(
                request,
                adminId.Value,
                cancellationToken);

            return CreatedAtAction(
                nameof(GetDemoAccounts),
                new { userId = result.UserId },
                result);
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
    /// List all demo accounts (Admin only)
    /// </summary>
    [HttpGet("demo-accounts")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<DemoAccountListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DemoAccountListDto>>> GetDemoAccounts(
        CancellationToken cancellationToken = default)
    {
        var accounts = await _demoAccountService.GetDemoAccountsAsync(cancellationToken);
        return Ok(accounts);
    }

    /// <summary>
    /// Manually trigger photo copying for a demo account (Admin only)
    /// Use this if the automatic photo copy job failed or needs to be re-run.
    /// This operation may take 30-60 seconds to complete.
    /// </summary>
    [HttpPost("demo-accounts/{userId:guid}/copy-photos")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PhotoCopyJobResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PhotoCopyJobResult>> TriggerPhotoCopy(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var adminId = GetCurrentUserId();
        if (!adminId.HasValue) return Unauthorized();

        var result = await _demoAccountService.TriggerPhotoCopyAsync(userId, adminId.Value, cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Hard delete a demo account and all associated data (Admin only)
    /// DANGEROUS: This permanently deletes the user, all data, and R2 files
    /// </summary>
    [HttpDelete("demo-accounts/{userId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(DemoAccountDeletionResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DemoAccountDeletionResult>> DeleteDemoAccount(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _demoAccountService.DeleteDemoAccountAsync(userId, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
                return NotFound(new { message = ex.Message });

            // Safety check failed
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion
}
