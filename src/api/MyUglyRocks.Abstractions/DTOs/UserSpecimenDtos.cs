using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

public record UserSpecimenDto(
    Guid UserSpecimenId,
    Guid UserId,
    string CommonName,
    string? ScientificName,
    string? Alias,
    string? RockFamily,
    string? Species,
    string? Variety,
    string MaterialType,
    decimal? MohsHardnessMin,
    decimal? MohsHardnessMax,
    string? TumblingDifficulty,
    string? RecommendedGritSequence,
    string? SpecialConsiderations,
    string? Notes,
    bool IsPublic,
    Guid? BasedOnSpecimenId,
    DateTime DateCreated
);

public record UserSpecimenListDto(
    Guid UserSpecimenId,
    string CommonName,
    string? ScientificName,
    string MaterialType,
    string? TumblingDifficulty,
    bool IsPublic,
    DateTime DateCreated
);

public record CreateUserSpecimenRequest(
    [Required(ErrorMessage = "Common name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Common name must be between 1 and 100 characters")]
    string CommonName,

    [StringLength(100, ErrorMessage = "Scientific name must be at most 100 characters")]
    string? ScientificName = null,

    [StringLength(255, ErrorMessage = "Alias must be at most 255 characters")]
    string? Alias = null,

    [StringLength(100, ErrorMessage = "Rock family must be at most 100 characters")]
    string? RockFamily = null,

    [StringLength(100, ErrorMessage = "Species must be at most 100 characters")]
    string? Species = null,

    [StringLength(100, ErrorMessage = "Variety must be at most 100 characters")]
    string? Variety = null,

    string MaterialType = "Rock",

    [Range(1.0, 10.0, ErrorMessage = "Mohs hardness min must be between 1.0 and 10.0")]
    decimal? MohsHardnessMin = null,

    [Range(1.0, 10.0, ErrorMessage = "Mohs hardness max must be between 1.0 and 10.0")]
    decimal? MohsHardnessMax = null,

    string? TumblingDifficulty = null,

    [StringLength(255, ErrorMessage = "Recommended grit sequence must be at most 255 characters")]
    string? RecommendedGritSequence = null,

    string? SpecialConsiderations = null,

    string? Notes = null,

    bool IsPublic = false,

    Guid? BasedOnSpecimenId = null
);

public record UpdateUserSpecimenRequest(
    [Required(ErrorMessage = "Common name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Common name must be between 1 and 100 characters")]
    string CommonName,

    [StringLength(100, ErrorMessage = "Scientific name must be at most 100 characters")]
    string? ScientificName = null,

    [StringLength(255, ErrorMessage = "Alias must be at most 255 characters")]
    string? Alias = null,

    [StringLength(100, ErrorMessage = "Rock family must be at most 100 characters")]
    string? RockFamily = null,

    [StringLength(100, ErrorMessage = "Species must be at most 100 characters")]
    string? Species = null,

    [StringLength(100, ErrorMessage = "Variety must be at most 100 characters")]
    string? Variety = null,

    string MaterialType = "Rock",

    [Range(1.0, 10.0, ErrorMessage = "Mohs hardness min must be between 1.0 and 10.0")]
    decimal? MohsHardnessMin = null,

    [Range(1.0, 10.0, ErrorMessage = "Mohs hardness max must be between 1.0 and 10.0")]
    decimal? MohsHardnessMax = null,

    string? TumblingDifficulty = null,

    [StringLength(255, ErrorMessage = "Recommended grit sequence must be at most 255 characters")]
    string? RecommendedGritSequence = null,

    string? SpecialConsiderations = null,

    string? Notes = null,

    bool IsPublic = false
);

/// <summary>
/// Combined DTO for UI dropdowns/pickers - includes both system and user specimens
/// </summary>
public record SpecimenOptionDto(
    Guid Id,
    string CommonName,
    string? ScientificName,
    string MaterialType,
    string? TumblingDifficulty,
    decimal? MohsHardnessMax,  // For hardness warning calculation
    string Source,  // "system" or "user"
    bool IsOwned,   // true if user created it
    Guid? BasedOnSpecimenId  // if derived from system specimen
);
