using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    #region Profile

    /// <summary>
    /// Get current user's profile
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var profile = await _userService.GetProfileAsync(userId.Value);
        if (profile == null) return NotFound();

        return Ok(profile);
    }

    /// <summary>
    /// Update current user's profile
    /// </summary>
    [HttpPut("me/profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var profile = await _userService.UpdateProfileAsync(userId.Value, request);
        if (profile == null) return NotFound();

        return Ok(profile);
    }

    /// <summary>
    /// Upload avatar for current user
    /// </summary>
    [HttpPost("me/avatar")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided" });

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" });

        // Validate file size (max 5MB)
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File too large. Maximum size is 5MB" });

        await using var stream = file.OpenReadStream();
        var avatarUrl = await _userService.UploadAvatarAsync(userId.Value, stream, file.FileName, file.ContentType);

        if (avatarUrl == null)
            return BadRequest(new { message = "Avatar upload not available. R2 storage integration pending." });

        return Ok(new { avatarUrl });
    }

    #endregion

    #region Settings

    /// <summary>
    /// Get current user's settings
    /// </summary>
    [HttpGet("me/settings")]
    [Authorize]
    [ProducesResponseType(typeof(UserSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserSettingsDto>> GetSettings()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var settings = await _userService.GetSettingsAsync(userId.Value);
        return Ok(settings);
    }

    /// <summary>
    /// Update current user's settings
    /// </summary>
    [HttpPut("me/settings")]
    [Authorize]
    [ProducesResponseType(typeof(UserSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserSettingsDto>> UpdateSettings([FromBody] UpdateSettingsRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var settings = await _userService.UpdateSettingsAsync(userId.Value, request);
        return Ok(settings);
    }

    #endregion

    #region Account

    /// <summary>
    /// Change current user's password
    /// </summary>
    [HttpPut("me/password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var success = await _userService.ChangePasswordAsync(userId.Value, request);
        if (!success)
            return BadRequest(new { message = "Current password is incorrect" });

        return NoContent();
    }

    /// <summary>
    /// Deactivate current user's account
    /// </summary>
    [HttpDelete("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var success = await _userService.DeactivateAccountAsync(userId.Value, request);
        if (!success)
            return BadRequest(new { message = "Password is incorrect" });

        return NoContent();
    }

    #endregion

    #region Stats

    /// <summary>
    /// Get current user's stats
    /// </summary>
    [HttpGet("me/stats")]
    [Authorize]
    [ProducesResponseType(typeof(UserStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserStatsDto>> GetStats()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var stats = await _userService.GetUserStatsAsync(userId.Value);
        return Ok(stats);
    }

    #endregion
}
