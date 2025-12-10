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

    /// <summary>
    /// Update session heartbeat (called periodically while user is active)
    /// </summary>
    [HttpPost("heartbeat/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Heartbeat(Guid sessionId, CancellationToken cancellationToken)
    {
        await _sessionAnalyticsService.UpdateHeartbeatAsync(sessionId, cancellationToken);
        return Ok();
    }

    /// <summary>
    /// Increment page view count for a session
    /// </summary>
    [HttpPost("pageview/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PageView(Guid sessionId, CancellationToken cancellationToken)
    {
        await _sessionAnalyticsService.IncrementPageViewAsync(sessionId, cancellationToken);
        return Ok();
    }

    /// <summary>
    /// End a session (called on logout)
    /// </summary>
    [HttpPost("end/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> EndSession(Guid sessionId, CancellationToken cancellationToken)
    {
        await _sessionAnalyticsService.EndSessionAsync(sessionId, cancellationToken);
        return Ok();
    }
}
