using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/user-specimens")]
[Authorize]
public class UserSpecimensController : ControllerBase
{
    private readonly IUserSpecimenService _userSpecimenService;

    public UserSpecimensController(IUserSpecimenService userSpecimenService)
    {
        _userSpecimenService = userSpecimenService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Get all custom specimens for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserSpecimenListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserSpecimens(
        [FromQuery] string? search,
        [FromQuery] string? materialType,
        [FromQuery] string sortBy = "commonName",
        [FromQuery] string sortOrder = "asc",
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        CancellationToken cancellationToken = default)
    {
        var specimens = await _userSpecimenService.GetUserSpecimensAsync(
            GetUserId(), search, materialType, sortBy, sortOrder, skip, take, cancellationToken);
        return Ok(specimens);
    }

    /// <summary>
    /// Get a specific custom specimen by ID
    /// </summary>
    [HttpGet("{userSpecimenId:guid}")]
    [ProducesResponseType(typeof(UserSpecimenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserSpecimen(Guid userSpecimenId, CancellationToken cancellationToken)
    {
        var specimen = await _userSpecimenService.GetUserSpecimenAsync(userSpecimenId, GetUserId(), cancellationToken);
        if (specimen == null)
            return NotFound();

        return Ok(specimen);
    }

    /// <summary>
    /// Create a new custom specimen
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(UserSpecimenDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUserSpecimen([FromBody] CreateUserSpecimenRequest request, CancellationToken cancellationToken)
    {
        var specimen = await _userSpecimenService.CreateUserSpecimenAsync(GetUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(GetUserSpecimen), new { userSpecimenId = specimen.UserSpecimenId }, specimen);
    }

    /// <summary>
    /// Update an existing custom specimen
    /// </summary>
    [HttpPut("{userSpecimenId:guid}")]
    [ProducesResponseType(typeof(UserSpecimenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserSpecimen(Guid userSpecimenId, [FromBody] UpdateUserSpecimenRequest request, CancellationToken cancellationToken)
    {
        var specimen = await _userSpecimenService.UpdateUserSpecimenAsync(userSpecimenId, GetUserId(), request, cancellationToken);
        if (specimen == null)
            return NotFound();

        return Ok(specimen);
    }

    /// <summary>
    /// Delete a custom specimen (soft delete)
    /// </summary>
    [HttpDelete("{userSpecimenId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUserSpecimen(Guid userSpecimenId, CancellationToken cancellationToken)
    {
        var success = await _userSpecimenService.DeleteUserSpecimenAsync(userSpecimenId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Combined search for all specimens (system + user's custom + public)
    /// For use in specimen picker dropdowns
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<SpecimenOptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchAllSpecimens(
        [FromQuery] string? search,
        [FromQuery] bool includePublic = true,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var specimens = await _userSpecimenService.SearchAllSpecimensAsync(
            GetUserId(), search, includePublic, skip, take, cancellationToken);
        return Ok(specimens);
    }
}
