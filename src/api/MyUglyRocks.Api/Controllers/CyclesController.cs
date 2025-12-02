using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CyclesController : ControllerBase
{
    private readonly ICycleService _cycleService;

    public CyclesController(ICycleService cycleService)
    {
        _cycleService = cycleService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Get all cycles for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CycleListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCycles([FromQuery] string? status, CancellationToken cancellationToken)
    {
        var cycles = await _cycleService.GetUserCyclesAsync(GetUserId(), status, cancellationToken);
        return Ok(cycles);
    }

    /// <summary>
    /// Get a specific cycle by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCycle(Guid id, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.GetCycleAsync(id, GetUserId(), cancellationToken);
        if (cycle == null)
            return NotFound();

        return Ok(cycle);
    }

    /// <summary>
    /// Create a new cycle
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCycle([FromBody] CreateCycleRequest request, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.CreateCycleAsync(GetUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(GetCycle), new { id = cycle.Id }, cycle);
    }

    /// <summary>
    /// Update an existing cycle
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCycle(Guid id, [FromBody] UpdateCycleRequest request, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.UpdateCycleAsync(id, GetUserId(), request, cancellationToken);
        if (cycle == null)
            return NotFound();

        return Ok(cycle);
    }

    /// <summary>
    /// Delete a cycle (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCycle(Guid id, CancellationToken cancellationToken)
    {
        var success = await _cycleService.DeleteCycleAsync(id, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Complete a cycle
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteCycle(Guid id, [FromBody] CompleteCycleRequest request, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.CompleteCycleAsync(id, GetUserId(), request, cancellationToken);
        if (cycle == null)
            return NotFound();

        return Ok(cycle);
    }

    /// <summary>
    /// Archive a cycle
    /// </summary>
    [HttpPost("{id:guid}/archive")]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveCycle(Guid id, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.ArchiveCycleAsync(id, GetUserId(), cancellationToken);
        if (cycle == null)
            return NotFound();

        return Ok(cycle);
    }

    /// <summary>
    /// Add a stage run to a cycle
    /// </summary>
    [HttpPost("{cycleId:guid}/stages")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddStageRun(Guid cycleId, [FromBody] CreateStageRunRequest request, CancellationToken cancellationToken)
    {
        var stageRun = await _cycleService.AddStageRunAsync(cycleId, GetUserId(), request, cancellationToken);
        if (stageRun == null)
            return NotFound();

        return CreatedAtAction(nameof(GetStageRun), new { id = stageRun.Id }, stageRun);
    }

    /// <summary>
    /// Get a specific stage run
    /// </summary>
    [HttpGet("stages/{id:guid}")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStageRun(Guid id, CancellationToken cancellationToken)
    {
        var stageRun = await _cycleService.GetStageRunAsync(id, GetUserId(), cancellationToken);
        if (stageRun == null)
            return NotFound();

        return Ok(stageRun);
    }

    /// <summary>
    /// Update a stage run
    /// </summary>
    [HttpPut("stages/{id:guid}")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStageRun(Guid id, [FromBody] UpdateStageRunRequest request, CancellationToken cancellationToken)
    {
        var stageRun = await _cycleService.UpdateStageRunAsync(id, GetUserId(), request, cancellationToken);
        if (stageRun == null)
            return NotFound();

        return Ok(stageRun);
    }

    /// <summary>
    /// Delete a stage run (soft delete)
    /// </summary>
    [HttpDelete("stages/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStageRun(Guid id, CancellationToken cancellationToken)
    {
        var success = await _cycleService.DeleteStageRunAsync(id, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Complete a stage run
    /// </summary>
    [HttpPost("stages/{id:guid}/complete")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteStageRun(Guid id, [FromBody] CompleteStageRunRequest request, CancellationToken cancellationToken)
    {
        var stageRun = await _cycleService.CompleteStageRunAsync(id, GetUserId(), request, cancellationToken);
        if (stageRun == null)
            return NotFound();

        return Ok(stageRun);
    }

    /// <summary>
    /// Add a cleaning run to a stage
    /// </summary>
    [HttpPost("stages/{stageId:guid}/cleaning")]
    [ProducesResponseType(typeof(CleaningRunDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddCleaningRun(Guid stageId, [FromBody] CreateCleaningRunRequest request, CancellationToken cancellationToken)
    {
        var cleaningRun = await _cycleService.AddCleaningRunAsync(stageId, GetUserId(), request, cancellationToken);
        if (cleaningRun == null)
            return NotFound();

        return CreatedAtAction(nameof(GetStageRun), new { id = stageId }, cleaningRun);
    }

    /// <summary>
    /// Complete a cleaning run
    /// </summary>
    [HttpPost("cleaning/{id:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteCleaningRun(Guid id, CancellationToken cancellationToken)
    {
        var success = await _cycleService.CompleteCleaningRunAsync(id, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Delete a cleaning run
    /// </summary>
    [HttpDelete("cleaning/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCleaningRun(Guid id, CancellationToken cancellationToken)
    {
        var success = await _cycleService.DeleteCleaningRunAsync(id, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Add a material to a stage run
    /// </summary>
    [HttpPost("stages/{stageId:guid}/materials")]
    [ProducesResponseType(typeof(StageMaterialDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddStageMaterial(Guid stageId, [FromBody] CreateStageMaterialRequest request, CancellationToken cancellationToken)
    {
        var material = await _cycleService.AddStageMaterialAsync(stageId, GetUserId(), request, cancellationToken);
        if (material == null)
            return NotFound();

        return CreatedAtAction(nameof(GetStageRun), new { id = stageId }, material);
    }

    /// <summary>
    /// Remove a material from a stage run
    /// </summary>
    [HttpDelete("stages/{stageId:guid}/materials/{materialId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveStageMaterial(Guid stageId, Guid materialId, CancellationToken cancellationToken)
    {
        var success = await _cycleService.RemoveStageMaterialAsync(stageId, materialId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }
}
