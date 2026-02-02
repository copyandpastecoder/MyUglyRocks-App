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
    [HttpGet("{cycleId:guid}")]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCycle(Guid cycleId, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.GetCycleAsync(cycleId, GetUserId(), cancellationToken);
        if (cycle == null)
            return NotFound();

        return Ok(cycle);
    }

    /// <summary>
    /// Get cycle statistics for the current user
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(CycleStatisticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var statistics = await _cycleService.GetCycleStatisticsAsync(GetUserId(), cancellationToken);
        return Ok(statistics);
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
        return CreatedAtAction(nameof(GetCycle), new { cycleId = cycle.CycleId }, cycle);
    }

    /// <summary>
    /// Update an existing cycle
    /// </summary>
    [HttpPut("{cycleId:guid}")]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCycle(Guid cycleId, [FromBody] UpdateCycleRequest request, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.UpdateCycleAsync(cycleId, GetUserId(), request, cancellationToken);
        if (cycle == null)
            return NotFound();

        return Ok(cycle);
    }

    /// <summary>
    /// Delete a cycle (soft delete)
    /// </summary>
    [HttpDelete("{cycleId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCycle(Guid cycleId, CancellationToken cancellationToken)
    {
        var success = await _cycleService.DeleteCycleAsync(cycleId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Complete a cycle
    /// </summary>
    [HttpPost("{cycleId:guid}/complete")]
    [ProducesResponseType(typeof(CycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteCycle(Guid cycleId, [FromBody] CompleteCycleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var cycle = await _cycleService.CompleteCycleAsync(cycleId, GetUserId(), request, cancellationToken);
            if (cycle == null)
                return NotFound();

            return Ok(cycle);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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

        return CreatedAtAction(nameof(GetStageRun), new { stageRunId = stageRun.StageRunId }, stageRun);
    }

    /// <summary>
    /// Get a specific stage run
    /// </summary>
    [HttpGet("stages/{stageRunId:guid}")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStageRun(Guid stageRunId, CancellationToken cancellationToken)
    {
        var stageRun = await _cycleService.GetStageRunAsync(stageRunId, GetUserId(), cancellationToken);
        if (stageRun == null)
            return NotFound();

        return Ok(stageRun);
    }

    /// <summary>
    /// Update a stage run
    /// </summary>
    [HttpPut("stages/{stageRunId:guid}")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStageRun(Guid stageRunId, [FromBody] UpdateStageRunRequest request, CancellationToken cancellationToken)
    {
        var stageRun = await _cycleService.UpdateStageRunAsync(stageRunId, GetUserId(), request, cancellationToken);
        if (stageRun == null)
            return NotFound();

        return Ok(stageRun);
    }

    /// <summary>
    /// Delete a stage run (soft delete)
    /// </summary>
    [HttpDelete("stages/{stageRunId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStageRun(Guid stageRunId, CancellationToken cancellationToken)
    {
        var success = await _cycleService.DeleteStageRunAsync(stageRunId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Complete a stage run
    /// </summary>
    [HttpPost("stages/{stageRunId:guid}/complete")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteStageRun(Guid stageRunId, [FromBody] CompleteStageRunRequest request, CancellationToken cancellationToken)
    {
        var stageRun = await _cycleService.CompleteStageRunAsync(stageRunId, GetUserId(), request, cancellationToken);
        if (stageRun == null)
            return NotFound();

        return Ok(stageRun);
    }

    /// <summary>
    /// Start a planned stage run (change status from Planned to Active)
    /// </summary>
    [HttpPost("stages/{stageRunId:guid}/start")]
    [ProducesResponseType(typeof(StageRunDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartStageRun(Guid stageRunId, CancellationToken cancellationToken)
    {
        try
        {
            var stageRun = await _cycleService.StartStageRunAsync(stageRunId, GetUserId(), cancellationToken);
            if (stageRun == null)
                return NotFound();

            return Ok(stageRun);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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

        return CreatedAtAction(nameof(GetStageRun), new { stageRunId = stageId }, cleaningRun);
    }

    /// <summary>
    /// Complete a cleaning run
    /// </summary>
    [HttpPost("cleaning/{cleaningRunId:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteCleaningRun(Guid cleaningRunId, CancellationToken cancellationToken)
    {
        var success = await _cycleService.CompleteCleaningRunAsync(cleaningRunId, GetUserId(), cancellationToken);
        if (!success)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Delete a cleaning run
    /// </summary>
    [HttpDelete("cleaning/{cleaningRunId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCleaningRun(Guid cleaningRunId, CancellationToken cancellationToken)
    {
        var success = await _cycleService.DeleteCleaningRunAsync(cleaningRunId, GetUserId(), cancellationToken);
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

        return CreatedAtAction(nameof(GetStageRun), new { stageRunId = stageId }, material);
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

    /// <summary>
    /// Get all photos for a cycle (for post photo selection)
    /// </summary>
    [HttpGet("{cycleId:guid}/photos")]
    [ProducesResponseType(typeof(IEnumerable<CyclePhotoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCyclePhotos(Guid cycleId, CancellationToken cancellationToken)
    {
        var photos = await _cycleService.GetCyclePhotosAsync(cycleId, GetUserId(), cancellationToken);
        return Ok(photos);
    }

    /// <summary>
    /// Merge two cycles into a new cycle
    /// </summary>
    [HttpPost("merge")]
    [ProducesResponseType(typeof(MergeCyclesResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MergeCycles([FromBody] MergeCyclesRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _cycleService.MergeCyclesAsync(GetUserId(), request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get source cycles that were merged to create this cycle
    /// </summary>
    [HttpGet("{cycleId:guid}/merge-sources")]
    [ProducesResponseType(typeof(IEnumerable<MergeSourceCycleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMergeSourceCycles(Guid cycleId, CancellationToken cancellationToken)
    {
        var sources = await _cycleService.GetMergeSourceCyclesAsync(cycleId, GetUserId(), cancellationToken);
        return Ok(sources);
    }

    /// <summary>
    /// Get the cycle this was merged into (if applicable)
    /// </summary>
    [HttpGet("{cycleId:guid}/merged-into")]
    [ProducesResponseType(typeof(MergedIntoCycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMergedIntoCycle(Guid cycleId, CancellationToken cancellationToken)
    {
        var target = await _cycleService.GetMergedIntoCycleAsync(cycleId, GetUserId(), cancellationToken);
        if (target == null)
            return NotFound();

        return Ok(target);
    }
}
