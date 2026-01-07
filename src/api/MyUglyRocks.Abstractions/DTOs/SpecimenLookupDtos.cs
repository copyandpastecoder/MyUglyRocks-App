using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

/// <summary>
/// Request to look up specimen information using AI
/// </summary>
public record SpecimenLookupRequest(
    [Required(ErrorMessage = "Common name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Common name must be between 2 and 100 characters")]
    string CommonName,

    /// <summary>Optional URL where the rock was found/purchased (helps identify trade names)</summary>
    [StringLength(500, ErrorMessage = "Source URL must be at most 500 characters")]
    string? SourceUrl = null,

    /// <summary>Optional seller/store name</summary>
    [StringLength(100, ErrorMessage = "Source name must be at most 100 characters")]
    string? SourceName = null,

    /// <summary>Optional description from the listing</summary>
    [StringLength(1000, ErrorMessage = "Source description must be at most 1000 characters")]
    string? SourceDescription = null
);

/// <summary>
/// AI-generated specimen information with confidence indicators
/// </summary>
public record SpecimenLookupResponse(
    /// <summary>Whether the lookup was successful</summary>
    bool Success,

    /// <summary>Error message if lookup failed</summary>
    string? Error,

    /// <summary>The looked-up specimen data</summary>
    SpecimenLookupData? Data
);

/// <summary>
/// Specimen data returned from AI lookup
/// </summary>
public record SpecimenLookupData(
    /// <summary>The common name that was searched</summary>
    string CommonName,

    /// <summary>Scientific name or chemical composition (e.g., SiO2)</summary>
    string? ScientificName,

    /// <summary>Alternative names, comma-separated</summary>
    string? Alias,

    /// <summary>Rock family classification (e.g., Agate, Jasper, Silicate, Carbonate)</summary>
    string? RockFamily,

    /// <summary>Mineral species/family (e.g., Quartz, Feldspar, Beryl)</summary>
    string? Species,

    /// <summary>Specific variety name</summary>
    string? Variety,

    /// <summary>Material type: Rock, Mineral, Glass, Fossil, Other</summary>
    string MaterialType,

    /// <summary>Minimum Mohs hardness (1-10)</summary>
    decimal? MohsHardnessMin,

    /// <summary>Maximum Mohs hardness (1-10)</summary>
    decimal? MohsHardnessMax,

    /// <summary>Tumbling difficulty: Easy, Intermediate, Advanced, Expert, Fragile</summary>
    string? TumblingDifficulty,

    /// <summary>Recommended grit sequence for tumbling</summary>
    string? RecommendedGritSequence,

    /// <summary>Special handling or tumbling considerations</summary>
    string? SpecialConsiderations,

    /// <summary>Whether this is a recognized/valid rock or mineral name</summary>
    bool IsKnownSpecimen,

    /// <summary>Confidence score from 0-100 indicating how confident the AI is</summary>
    int ConfidenceScore,

    /// <summary>Brief explanation of the confidence score</summary>
    string? ConfidenceReason
);

/// <summary>
/// Response from lookup-and-create endpoint
/// </summary>
public record SpecimenLookupAndCreateResponse(
    /// <summary>Whether the lookup was successful</summary>
    bool Success,

    /// <summary>Error message if lookup failed</summary>
    string? Error,

    /// <summary>The looked-up specimen data</summary>
    SpecimenLookupData? Data,

    /// <summary>System specimen ID if confidence >= 85% (added to Specimens table)</summary>
    Guid? SpecimenId
);
