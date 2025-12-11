using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SessionController : ControllerBase
{
    private readonly ISessionAnalyticsService _sessionAnalyticsService;
    private readonly ILogger<SessionController> _logger;

    public SessionController(
        ISessionAnalyticsService sessionAnalyticsService,
        ILogger<SessionController> logger)
    {
        _sessionAnalyticsService = sessionAnalyticsService;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    /// <summary>
    /// Update session heartbeat (called periodically while user is active)
    /// </summary>
    [HttpPost("heartbeat/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Heartbeat(Guid sessionId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }

        var success = await _sessionAnalyticsService.UpdateHeartbeatAsync(sessionId, userId, cancellationToken);
        if (!success)
        {
            return NotFound();
        }

        return Ok();
    }

    /// <summary>
    /// Increment page view count for a session
    /// </summary>
    [HttpPost("pageview/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PageView(Guid sessionId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }

        var success = await _sessionAnalyticsService.IncrementPageViewAsync(sessionId, userId, cancellationToken);
        if (!success)
        {
            return NotFound();
        }

        return Ok();
    }

    /// <summary>
    /// End a session (called on logout)
    /// </summary>
    [HttpPost("end/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EndSession(Guid sessionId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized();
        }

        var success = await _sessionAnalyticsService.EndSessionAsync(sessionId, userId, cancellationToken);
        if (!success)
        {
            return NotFound();
        }

        return Ok();
    }
}
