using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

public record InventoryDto(
    Guid InventoryId,
    string Name,
    DateOnly AcquiredDate,
    Guid? InventorySourceId,
    InventorySourceSummaryDto? InventorySource,
    decimal? TotalWeightGrams,
    decimal? RemainingWeightGrams,
    string DisplayUnit,
    decimal? Cost,  // Aggregated from specimens
    string[]? SizeCategories,  // Aggregated from specimens
    int? QualityRating,  // Aggregated from specimens (average)
    string? StorageLocation,
    string? Notes,
    DateTime DateCreated,
    DateTime DateUpdated,
    IEnumerable<InventorySpecimenDto> Specimens,
    IEnumerable<InventoryPhotoDto> Photos,
    // Computed fields
    decimal? DisplayTotalWeight,
    decimal? DisplayRemainingWeight,
    int PhotoCount,
    // Legacy fields for backwards compatibility during transition
    string SourceType,
    string? SourceName,
    string? SourceLocation,
    string? SourceUrl,
    string Status,
    bool IsFavorite
);

/// <summary>
/// Summary DTO for InventorySource when embedded in Inventory responses
/// </summary>
public record InventorySourceSummaryDto(
    Guid InventorySourceId,
    string SourceType,
    string Name,
    string? Location,
    string? Phone,
    string? Url,
    string? ContactName
);

public record InventoryListDto(
    Guid InventoryId,
    string Name,
    DateOnly AcquiredDate,
    Guid? InventorySourceId,
    string? SourceType,  // From InventorySource
    string? SourceName,  // From InventorySource.Name
    decimal? TotalWeightGrams,
    decimal? RemainingWeightGrams,
    string DisplayUnit,
    decimal? Cost,  // Aggregated from specimens
    int? QualityRating,  // Aggregated from specimens (average)
    DateTime DateCreated,
    int SpecimenCount,
    int PhotoCount,
    string? CoverPhotoUrl,
    string? CoverPhotoThumbnailUrl,
    // Specimen status counts
    int AvailableCount,
    int InUseCount,
    int DepletedCount,
    // Legacy fields for backwards compatibility
    string Status,
    bool IsFavorite
);

public record CreateInventoryRequest(
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [Required(ErrorMessage = "Acquired date is required")]
    DateOnly AcquiredDate,

    Guid? InventorySourceId,

    [StringLength(10, ErrorMessage = "Display unit must be at most 10 characters")]
    string? DisplayUnit,

    [StringLength(255, ErrorMessage = "Storage location must be at most 255 characters")]
    string? StorageLocation,

    [StringLength(2000, ErrorMessage = "Notes must be at most 2000 characters")]
    string? Notes,

    IEnumerable<CreateInventorySpecimenRequest>? Specimens,

    // Legacy fields - still accepted for backwards compatibility during transition
    string? SourceType,
    string? SourceName,
    string? SourceLocation,
    string? SourceUrl,
    string? Status,
    bool? IsFavorite
);

public record UpdateInventoryRequest(
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [Required(ErrorMessage = "Acquired date is required")]
    DateOnly AcquiredDate,

    Guid? InventorySourceId,

    [StringLength(10, ErrorMessage = "Display unit must be at most 10 characters")]
    string? DisplayUnit,

    [StringLength(255, ErrorMessage = "Storage location must be at most 255 characters")]
    string? StorageLocation,

    [StringLength(2000, ErrorMessage = "Notes must be at most 2000 characters")]
    string? Notes,

    IEnumerable<CreateInventorySpecimenRequest>? Specimens,

    // Legacy fields - still accepted for backwards compatibility during transition
    string? SourceType,
    string? SourceName,
    string? SourceLocation,
    string? SourceUrl,
    string? Status,
    bool? IsFavorite
);

public record UpdateInventoryStatusRequest(
    [Required(ErrorMessage = "Status is required")]
    string Status
);

public record UpdateInventorySpecimensRequest(
    [Required(ErrorMessage = "Specimens list is required")]
    IEnumerable<CreateInventorySpecimenRequest> Specimens
);

public record InventorySpecimenDto(
    Guid InventorySpecimenId,
    Guid? SpecimenId,
    Guid? UserSpecimenId,
    string CommonName,
    string? ScientificName,
    string MaterialType,
    string? TumblingDifficulty,
    decimal? WeightGrams,
    decimal? Cost,
    string? Condition,
    int? QualityRating,
    string[]? SizeCategories,
    string? Notes,
    string Status,  // Available, InUse, Depleted, Partial
    string? StorageLocation,
    string? Url,
    string Source  // "system" or "user"
);

public record CreateInventorySpecimenRequest(
    Guid? SpecimenId,
    Guid? UserSpecimenId,

    [Range(0, 1000000, ErrorMessage = "Weight must be between 0 and 1,000,000 grams")]
    decimal? WeightGrams,

    [Range(0, 1000000, ErrorMessage = "Cost must be between 0 and 1,000,000")]
    decimal? Cost,

    string? Condition,

    [Range(1, 5, ErrorMessage = "Quality rating must be between 1 and 5")]
    int? QualityRating,

    string[]? SizeCategories,

    [StringLength(500, ErrorMessage = "Notes must be at most 500 characters")]
    string? Notes,

    string? Status,  // Available, InUse, Depleted, Partial (defaults to Available)

    [StringLength(255, ErrorMessage = "Storage location must be at most 255 characters")]
    string? StorageLocation,

    [StringLength(500, ErrorMessage = "URL must be at most 500 characters")]
    string? Url
);

public record InventoryPhotoDto(
    Guid InventoryPhotoId,
    string Url,
    string? FileName,
    string? Caption,
    bool IsCover,
    int SortOrder,
    DateTime DateCreated,
    string? ThumbnailUrl,
    string? MediumUrl,
    string? LargeUrl,
    string? BlurHash,
    int? Width,
    int? Height,
    string ProcessingStatus,
    string? ProcessingError,
    // Specimen link
    Guid? InventorySpecimenId,
    string? SpecimenName  // CommonName of the linked specimen
);

public record InventoryStatsDto(
    int TotalItems,
    decimal TotalWeightGrams,
    decimal TotalInvested,
    int AvailableCount,
    int InUseCount,
    int DepletedCount
);
