using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TumblersController : ControllerBase
{
    private readonly ITumblerService _tumblerService;

    public TumblersController(ITumblerService tumblerService)
    {
        _tumblerService = tumblerService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Get all tumblers for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TumblerListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTumblers(CancellationToken cancellationToken)
    {
        var tumblers = await _tumblerService.GetUserTumblersAsync(GetUserId(), cancellationToken);
        return Ok(tumblers);
    }

    /// <summary>
    /// Get a specific tumbler by ID
    /// </summary>
    [HttpGet("{tumblerId:guid}")]
    [ProducesResponseType(typeof(TumblerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTumbler(Guid tumblerId, CancellationToken cancellationToken)
    {
        var tumbler = await _tumblerService.GetTumblerAsync(tumblerId, GetUserId(), cancellationToken);
        if (tumbler == null)
            return NotFound();

        return Ok(tumbler);
    }

    /// <summary>
    /// Create a new tumbler
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TumblerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTumbler([FromBody] CreateTumblerRequest request, CancellationToken cancellationToken)
    {
        var tumbler = await _tumblerService.CreateTumblerAsync(GetUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(GetTumbler), new { id = tumbler.TumblerId }, tumbler);
    }

    /// <summary>
    /// Update an existing tumbler
    /// </summary>
    [HttpPut("{tumblerId:guid}")]
    [ProducesResponseType(typeof(TumblerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTumbler(Guid tumblerId, [FromBody] UpdateTumblerRequest request, CancellationToken cancellationToken)
    {
        var tumbler = await _tumblerService.UpdateTumblerAsync(tumblerId, GetUserId(), request, cancellationToken);
        if (tumbler == null)
            return NotFound();

        return Ok(tumbler);
    }

    /// <summary>
    /// Delete a tumbler (soft delete if has stage runs, hard delete otherwise)
    /// </summary>
    [HttpDelete("{tumblerId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTumbler(Guid tumblerId, CancellationToken cancellationToken)
    {
        var success = await _tumblerService.DeleteTumblerAsync(tumblerId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Add a barrel to a tumbler
    /// </summary>
    [HttpPost("{tumblerId:guid}/barrels")]
    [ProducesResponseType(typeof(BarrelDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddBarrel(Guid tumblerId, [FromBody] CreateBarrelRequest request, CancellationToken cancellationToken)
    {
        var barrel = await _tumblerService.AddBarrelAsync(tumblerId, GetUserId(), request, cancellationToken);
        if (barrel == null)
            return NotFound();

        return CreatedAtAction(nameof(GetTumbler), new { id = tumblerId }, barrel);
    }

    /// <summary>
    /// Update a barrel
    /// </summary>
    [HttpPut("barrels/{barrelId:guid}")]
    [ProducesResponseType(typeof(BarrelDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBarrel(Guid barrelId, [FromBody] UpdateBarrelRequest request, CancellationToken cancellationToken)
    {
        var barrel = await _tumblerService.UpdateBarrelAsync(barrelId, GetUserId(), request, cancellationToken);
        if (barrel == null)
            return NotFound();

        return Ok(barrel);
    }

    /// <summary>
    /// Delete a barrel (soft delete if has stage runs, hard delete otherwise)
    /// </summary>
    [HttpDelete("barrels/{barrelId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBarrel(Guid barrelId, CancellationToken cancellationToken)
    {
        var success = await _tumblerService.DeleteBarrelAsync(barrelId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Get available tumbler models (for dropdown)
    /// </summary>
    [HttpGet("models")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<TumblerModelDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTumblerModels(CancellationToken cancellationToken)
    {
        var models = await _tumblerService.GetTumblerModelsAsync(cancellationToken);
        return Ok(models);
    }
}
