using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Infrastructure.Services;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuthController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly int _refreshTokenExpirationDays;

    public AuthController(
        IAuthService authService,
        IServiceScopeFactory scopeFactory,
        ILogger<AuthController> logger,
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _authService = authService;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _environment = environment;
        _refreshTokenExpirationDays = int.Parse(configuration["Jwt:RefreshTokenExpirationDays"] ?? "90");
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        SetRefreshTokenCookie(result.RefreshToken!);
        _logger.LogInformation("User registered: {Email}", request.Email);

        return Ok(result);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);

        if (!result.Success)
        {
            return Unauthorized(result);
        }

        SetRefreshTokenCookie(result.RefreshToken!);
        _logger.LogInformation("User logged in: {Email}", request.Email);

        // Record session analytics (fire-and-forget, non-blocking)
        Guid? sessionId = null;
        if (result.User != null)
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var sessionInfo = new SessionInfoRequest(
                request.ScreenWidth,
                request.ScreenHeight,
                request.SupportsWebP,
                request.SupportsAvif,
                request.Timezone,
                request.Language,
                request.ReferrerDomain
            );

            // Capture values for the background task
            var userId = result.User.UserId;

            // Fire-and-forget with its own DI scope (the controller's DbContext gets disposed after response)
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var analyticsService = scope.ServiceProvider.GetRequiredService<SessionAnalyticsService>();
                    sessionId = await analyticsService.RecordSessionWithUserAgentAsync(
                        userId, userAgent, sessionInfo, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to record session analytics for user {UserId}", userId);
                }
            });
        }

        // Return result (sessionId won't be set yet since it's fire-and-forget)
        return Ok(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResult), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies["refreshToken"];

        // No token = not logged in, return gracefully (not an error)
        if (string.IsNullOrEmpty(refreshToken))
        {
            _logger.LogDebug("Refresh: No refresh token cookie present");
            return Ok(new AuthResult(false));
        }

        _logger.LogDebug("Refresh: Token present (length={Length})", refreshToken.Length);
        var result = await _authService.RefreshTokenAsync(refreshToken, cancellationToken);

        if (!result.Success)
        {
            // Token was invalid/expired - clear the cookie and return gracefully
            _logger.LogDebug("Refresh failed: {Error}", result.Error);
            ClearRefreshTokenCookie();
            return Ok(new AuthResult(false));
        }

        _logger.LogDebug("Refresh succeeded for user {UserId}", result.User?.UserId);
        SetRefreshTokenCookie(result.RefreshToken!);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var refreshToken = Request.Cookies["refreshToken"];

        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(userId, refreshToken, cancellationToken);
        }

        ClearRefreshTokenCookie();
        _logger.LogInformation("User logged out: {UserId}", userId);

        return Ok(new { message = "Logged out successfully" });
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.VerifyEmailAsync(request.Token, cancellationToken);

        if (!result)
        {
            return BadRequest(new { message = "Invalid or expired verification token" });
        }

        return Ok(new { message = "Email verified successfully" });
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.RequestPasswordResetAsync(request.Email, cancellationToken);

        // Always return success to prevent email enumeration
        return Ok(new { message = "If the email exists, a password reset link will be sent" });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.ResetPasswordAsync(request.Token, request.NewPassword, cancellationToken);

        if (!result)
        {
            return BadRequest(new { message = "Invalid or expired reset token" });
        }

        return Ok(new { message = "Password reset successfully" });
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value;
        var username = User.FindFirst("username")?.Value;
        var isAdmin = User.IsInRole("Admin");

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        return Ok(new
        {
            id = userId,
            email,
            username,
            isAdmin
        });
    }

    private void SetRefreshTokenCookie(string token)
    {
        // SameSite=Lax works because web and API are same-origin via nginx-ingress
        // Path=/ ensures cookie is sent for all paths including /api
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
            Path = "/" // Critical: must be "/" not "/api" so cookie works for both web and API
        };

        Response.Cookies.Append("refreshToken", token, cookieOptions);
        _logger.LogDebug("Set refresh token cookie (Path=/, SameSite=Lax, Secure=true, Expires={Expires}, Days={Days})",
            cookieOptions.Expires, _refreshTokenExpirationDays);
    }

    private void ClearRefreshTokenCookie()
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(-1), // Expired in the past
            Path = "/"
        };

        Response.Cookies.Delete("refreshToken", cookieOptions);
    }
}
