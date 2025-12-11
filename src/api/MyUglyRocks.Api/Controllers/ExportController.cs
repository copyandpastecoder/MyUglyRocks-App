using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
[EnableRateLimiting("intensive")]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Export all cycles as CSV
    /// </summary>
    [HttpGet("cycles")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportCycles([FromQuery] ExportCyclesRequest? request = null)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _exportService.ExportCyclesAsync(userId.Value, request);
        return File(result.Data, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Export a single cycle with all its stages as CSV
    /// </summary>
    [HttpGet("cycles/{cycleId:guid}")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportCycle(Guid cycleId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var result = await _exportService.ExportCycleAsync(userId.Value, cycleId);
            return File(result.Data, result.ContentType, result.FileName);
        }
        catch (InvalidOperationException)
        {
            return NotFound(new { message = "Cycle not found" });
        }
    }

    /// <summary>
    /// Export all stages across all cycles as CSV
    /// </summary>
    [HttpGet("stages")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportStages([FromQuery] ExportCyclesRequest? request = null)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _exportService.ExportStagesAsync(userId.Value, request);
        return File(result.Data, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Export all tumblers as CSV
    /// </summary>
    [HttpGet("tumblers")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportTumblers()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _exportService.ExportTumblersAsync(userId.Value);
        return File(result.Data, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Export all posts as CSV
    /// </summary>
    [HttpGet("posts")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportPosts()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _exportService.ExportPostsAsync(userId.Value);
        return File(result.Data, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Export all user data (GDPR compliance) - returns ZIP with multiple CSVs
    /// </summary>
    /// <remarks>
    /// This endpoint exports all user data including profile, settings, cycles, stages,
    /// tumblers, posts, comments, and votes. Password verification is required for security.
    /// </remarks>
    [HttpPost("full")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportFullData([FromBody] FullExportRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var result = await _exportService.ExportFullDataAsync(userId.Value, request.Password);
            return File(result.Data, result.ContentType, result.FileName);
        }
        catch (UnauthorizedAccessException)
        {
            return BadRequest(new { message = "Invalid password" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
