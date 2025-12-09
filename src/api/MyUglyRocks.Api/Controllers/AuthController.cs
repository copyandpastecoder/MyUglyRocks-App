using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IAuthService authService, ILogger<AuthController> logger, IWebHostEnvironment environment)
    {
        _authService = authService;
        _logger = logger;
        _environment = environment;
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

        _logger.LogDebug("Refresh succeeded for user {UserId}", result.User?.Id);
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
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax, // Lax allows cookies on top-level navigations (refresh, direct URL)
            Expires = DateTime.UtcNow.AddDays(7)
        };

        Response.Cookies.Append("refreshToken", token, cookieOptions);
    }

    private void ClearRefreshTokenCookie()
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(-1) // Expired in the past
        };

        Response.Cookies.Delete("refreshToken", cookieOptions);
    }
}
