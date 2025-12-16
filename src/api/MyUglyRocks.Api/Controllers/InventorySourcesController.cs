using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/inventory-sources")]
[Authorize]
public class InventorySourcesController : ControllerBase
{
    private readonly IInventorySourceService _sourceService;

    public InventorySourcesController(IInventorySourceService sourceService)
    {
        _sourceService = sourceService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Get all inventory sources for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<InventorySourceListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSources(
        [FromQuery] string? sourceType,
        [FromQuery] bool? isActive,
        [FromQuery] string? search,
        [FromQuery] string sortBy = "name",
        [FromQuery] string sortOrder = "asc",
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var items = await _sourceService.GetUserSourcesAsync(
            GetUserId(), sourceType, isActive, search, sortBy, sortOrder, skip, take, cancellationToken);
        return Ok(items);
    }

    /// <summary>
    /// Get a specific inventory source by ID
    /// </summary>
    [HttpGet("{sourceId:guid}")]
    [ProducesResponseType(typeof(InventorySourceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSource(Guid sourceId, CancellationToken cancellationToken)
    {
        var source = await _sourceService.GetSourceAsync(sourceId, GetUserId(), cancellationToken);
        if (source == null)
            return NotFound();

        return Ok(source);
    }

    /// <summary>
    /// Create a new inventory source
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(InventorySourceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateSource([FromBody] CreateInventorySourceRequest request, CancellationToken cancellationToken)
    {
        // Check if name already exists
        if (await _sourceService.SourceNameExistsAsync(GetUserId(), request.SourceType, request.Name, null, cancellationToken))
        {
            return Conflict(new { message = "A source with this name and type already exists." });
        }

        var source = await _sourceService.CreateSourceAsync(GetUserId(), request, cancellationToken);
        if (source == null)
            return BadRequest(new { message = "Invalid source type or failed to create source." });

        return CreatedAtAction(nameof(GetSource), new { sourceId = source.InventorySourceId }, source);
    }

    /// <summary>
    /// Update an existing inventory source
    /// </summary>
    [HttpPut("{sourceId:guid}")]
    [ProducesResponseType(typeof(InventorySourceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateSource(Guid sourceId, [FromBody] UpdateInventorySourceRequest request, CancellationToken cancellationToken)
    {
        // Check if name already exists (excluding current source)
        if (await _sourceService.SourceNameExistsAsync(GetUserId(), request.SourceType, request.Name, sourceId, cancellationToken))
        {
            return Conflict(new { message = "A source with this name and type already exists." });
        }

        var source = await _sourceService.UpdateSourceAsync(sourceId, GetUserId(), request, cancellationToken);
        if (source == null)
            return NotFound();

        return Ok(source);
    }

    /// <summary>
    /// Delete an inventory source
    /// </summary>
    /// <remarks>
    /// Cannot delete a source that has linked inventory items.
    /// </remarks>
    [HttpDelete("{sourceId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteSource(Guid sourceId, CancellationToken cancellationToken)
    {
        var source = await _sourceService.GetSourceAsync(sourceId, GetUserId(), cancellationToken);
        if (source == null)
            return NotFound();

        // Check if source has linked inventory
        if (source.TotalPurchases > 0)
        {
            return Conflict(new { message = "Cannot delete source with linked inventory items. Remove or reassign the inventory items first." });
        }

        var success = await _sourceService.DeleteSourceAsync(sourceId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Check if a source name exists
    /// </summary>
    [HttpGet("check-name")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckName(
        [FromQuery] string sourceType,
        [FromQuery] string name,
        [FromQuery] Guid? excludeSourceId,
        CancellationToken cancellationToken)
    {
        var exists = await _sourceService.SourceNameExistsAsync(GetUserId(), sourceType, name, excludeSourceId, cancellationToken);
        return Ok(new { exists });
    }
}
