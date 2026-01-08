using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

/// <summary>
/// Controller for logging client-side errors from the UI
/// </summary>
[ApiController]
[Route("api/errors")]
public class ErrorController : ControllerBase
{
    private readonly IErrorLogService _errorLogService;
    private readonly ILogger<ErrorController> _logger;

    public ErrorController(
        IErrorLogService errorLogService,
        ILogger<ErrorController> logger)
    {
        _errorLogService = errorLogService;
        _logger = logger;
    }

    /// <summary>
    /// Log a client-side error from the UI
    /// </summary>
    /// <param name="request">Client error details</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>204 No Content on success</returns>
    [HttpPost("log-client-error")]
    [AllowAnonymous] // Errors can occur before login
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LogClientError(
        [FromBody] ClientErrorRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Error message is required" });
        }

        if (string.IsNullOrWhiteSpace(request.ExceptionType))
        {
            return BadRequest(new { message = "Exception type is required" });
        }

        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest(new { message = "URL is required" });
        }

        // Get client IP address
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // Log to Serilog for immediate visibility
        _logger.LogWarning(
            "Client error received: {ExceptionType}: {Message} at {Url}",
            request.ExceptionType,
            request.Message,
            request.Url);

        // Log to database (fire-and-forget)
        _ = Task.Run(async () =>
        {
            try
            {
                await _errorLogService.LogClientErrorAsync(request, ipAddress, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log client error to database");
            }
        }, cancellationToken);

        return NoContent();
    }
}
