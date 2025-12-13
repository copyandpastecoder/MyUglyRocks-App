using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Get all inventory items for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<InventoryListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventory(
        [FromQuery] string? status,
        [FromQuery] string? sourceType,
        [FromQuery] Guid? specimenId,
        [FromQuery] bool? favorites,
        [FromQuery] string? search,
        [FromQuery] string sortBy = "acquiredDate",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        CancellationToken cancellationToken = default)
    {
        var items = await _inventoryService.GetUserInventoryAsync(
            GetUserId(), status, sourceType, specimenId, favorites, search, sortBy, sortOrder, skip, take, cancellationToken);
        return Ok(items);
    }

    /// <summary>
    /// Get inventory statistics for the current user
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(InventoryStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventoryStats(CancellationToken cancellationToken)
    {
        var stats = await _inventoryService.GetInventoryStatsAsync(GetUserId(), cancellationToken);
        return Ok(stats);
    }

    /// <summary>
    /// Get a specific inventory item by ID
    /// </summary>
    [HttpGet("{inventoryId:guid}")]
    [ProducesResponseType(typeof(InventoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInventoryItem(Guid inventoryId, CancellationToken cancellationToken)
    {
        var inventory = await _inventoryService.GetInventoryAsync(inventoryId, GetUserId(), cancellationToken);
        if (inventory == null)
            return NotFound();

        return Ok(inventory);
    }

    /// <summary>
    /// Create a new inventory item
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(InventoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateInventory([FromBody] CreateInventoryRequest request, CancellationToken cancellationToken)
    {
        var inventory = await _inventoryService.CreateInventoryAsync(GetUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(GetInventoryItem), new { inventoryId = inventory.InventoryId }, inventory);
    }

    /// <summary>
    /// Update an existing inventory item
    /// </summary>
    [HttpPut("{inventoryId:guid}")]
    [ProducesResponseType(typeof(InventoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateInventory(Guid inventoryId, [FromBody] UpdateInventoryRequest request, CancellationToken cancellationToken)
    {
        var inventory = await _inventoryService.UpdateInventoryAsync(inventoryId, GetUserId(), request, cancellationToken);
        if (inventory == null)
            return NotFound();

        return Ok(inventory);
    }

    /// <summary>
    /// Delete an inventory item (soft delete)
    /// </summary>
    [HttpDelete("{inventoryId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteInventory(Guid inventoryId, CancellationToken cancellationToken)
    {
        var success = await _inventoryService.DeleteInventoryAsync(inventoryId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Quick status update for an inventory item
    /// </summary>
    [HttpPatch("{inventoryId:guid}/status")]
    [ProducesResponseType(typeof(InventoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateInventoryStatus(Guid inventoryId, [FromBody] UpdateInventoryStatusRequest request, CancellationToken cancellationToken)
    {
        var inventory = await _inventoryService.UpdateInventoryStatusAsync(inventoryId, GetUserId(), request, cancellationToken);
        if (inventory == null)
            return NotFound();

        return Ok(inventory);
    }

    /// <summary>
    /// Update specimens for an inventory item
    /// </summary>
    [HttpPut("{inventoryId:guid}/specimens")]
    [ProducesResponseType(typeof(InventoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateInventorySpecimens(Guid inventoryId, [FromBody] UpdateInventorySpecimensRequest request, CancellationToken cancellationToken)
    {
        var inventory = await _inventoryService.UpdateInventorySpecimensAsync(inventoryId, GetUserId(), request, cancellationToken);
        if (inventory == null)
            return NotFound();

        return Ok(inventory);
    }
}
