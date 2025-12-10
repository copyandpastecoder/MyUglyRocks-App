using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/waitlist")]
public class WaitlistController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<WaitlistController> _logger;

    public WaitlistController(AppDbContext context, ILogger<WaitlistController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Join the waitlist to be notified when the app launches
    /// </summary>
    [HttpPost]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(JoinWaitlistResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(JoinWaitlistResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JoinWaitlistResponse>> JoinWaitlist([FromBody] JoinWaitlistRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new JoinWaitlistResponse(false, "Email is required"));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // Check if email is already on the waitlist
        var exists = await _context.WaitlistEntries
            .AnyAsync(w => w.Email == normalizedEmail);

        if (exists)
        {
            // Return success anyway to prevent email enumeration
            return Ok(new JoinWaitlistResponse(true));
        }

        var entry = new WaitlistEntry
        {
            WaitlistEntryId = Guid.NewGuid(),
            Email = normalizedEmail,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.ToString().Length > 512
                ? Request.Headers.UserAgent.ToString()[..512]
                : Request.Headers.UserAgent.ToString(),
            NotificationSent = false,
            DateCreated = DateTime.UtcNow,
            DateUpdated = DateTime.UtcNow
        };

        _context.WaitlistEntries.Add(entry);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New waitlist signup: {Email}", normalizedEmail);

        return Ok(new JoinWaitlistResponse(true));
    }
}
