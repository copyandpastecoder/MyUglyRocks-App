using Microsoft.AspNetCore.Mvc;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;

namespace MyUglyRocks.Api.Controllers;

[ApiController]
[Route("api")]
public class ReferenceDataController : ControllerBase
{
    private readonly IReferenceDataService _referenceDataService;

    public ReferenceDataController(IReferenceDataService referenceDataService)
    {
        _referenceDataService = referenceDataService;
    }

    #region Specimens

    /// <summary>
    /// Get all specimens (public)
    /// </summary>
    [HttpGet("specimens")]
    [ProducesResponseType(typeof(IEnumerable<SpecimenListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SpecimenListDto>>> GetSpecimens(
        [FromQuery] string? query = null,
        [FromQuery] string? materialType = null,
        [FromQuery] string? difficulty = null,
        [FromQuery] decimal? minHardness = null,
        [FromQuery] decimal? maxHardness = null)
    {
        var search = new SpecimenSearchRequest
        {
            Query = query,
            MaterialType = materialType,
            Difficulty = difficulty,
            MinHardness = minHardness,
            MaxHardness = maxHardness
        };

        var specimens = await _referenceDataService.GetSpecimensAsync(search);
        return Ok(specimens);
    }

    /// <summary>
    /// Get specimen by ID (public)
    /// </summary>
    [HttpGet("specimens/{id:guid}")]
    [ProducesResponseType(typeof(SpecimenDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SpecimenDetailDto>> GetSpecimen(Guid id)
    {
        var specimen = await _referenceDataService.GetSpecimenByIdAsync(id);
        if (specimen == null)
        {
            return NotFound();
        }
        return Ok(specimen);
    }

    #endregion

    #region Materials

    /// <summary>
    /// Get all materials (public)
    /// </summary>
    [HttpGet("materials")]
    [ProducesResponseType(typeof(IEnumerable<MaterialListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MaterialListDto>>> GetMaterials(
        [FromQuery] string? query = null,
        [FromQuery] string? category = null,
        [FromQuery] string? usageType = null)
    {
        var search = new MaterialSearchRequest
        {
            Query = query,
            Category = category,
            UsageType = usageType
        };

        var materials = await _referenceDataService.GetMaterialsAsync(search);
        return Ok(materials);
    }

    /// <summary>
    /// Get material by ID (public)
    /// </summary>
    [HttpGet("materials/{id:guid}")]
    [ProducesResponseType(typeof(MaterialDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MaterialDetailDto>> GetMaterial(Guid id)
    {
        var material = await _referenceDataService.GetMaterialByIdAsync(id);
        if (material == null)
        {
            return NotFound();
        }
        return Ok(material);
    }

    #endregion
}
