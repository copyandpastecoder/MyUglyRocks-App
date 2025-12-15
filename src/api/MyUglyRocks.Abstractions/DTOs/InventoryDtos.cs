using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

public record InventoryDto(
    Guid InventoryId,
    string Name,
    DateOnly AcquiredDate,
    string SourceType,
    string? SourceName,
    string? SourceLocation,
    string? SourceUrl,
    decimal? TotalWeightGrams,
    decimal? RemainingWeightGrams,
    string DisplayUnit,
    decimal? Cost,  // Aggregated from specimens
    string[]? SizeCategories,  // Aggregated from specimens
    int? QualityRating,  // Aggregated from specimens (average)
    string Status,
    string? StorageLocation,
    string? Notes,
    bool IsFavorite,
    DateTime DateCreated,
    DateTime DateUpdated,
    IEnumerable<InventorySpecimenDto> Specimens,
    IEnumerable<InventoryPhotoDto> Photos,
    // Computed fields
    decimal? DisplayTotalWeight,
    decimal? DisplayRemainingWeight,
    int PhotoCount
);

public record InventoryListDto(
    Guid InventoryId,
    string Name,
    DateOnly AcquiredDate,
    string SourceType,
    string? SourceName,
    decimal? TotalWeightGrams,
    decimal? RemainingWeightGrams,
    string DisplayUnit,
    decimal? Cost,  // Aggregated from specimens
    int? QualityRating,  // Aggregated from specimens (average)
    string Status,
    bool IsFavorite,
    DateTime DateCreated,
    int SpecimenCount,
    int PhotoCount,
    string? CoverPhotoUrl,
    string? CoverPhotoThumbnailUrl
);

public record CreateInventoryRequest(
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [Required(ErrorMessage = "Acquired date is required")]
    DateOnly AcquiredDate,

    [Required(ErrorMessage = "Source type is required")]
    string SourceType,

    [StringLength(255, ErrorMessage = "Source name must be at most 255 characters")]
    string? SourceName,

    [StringLength(255, ErrorMessage = "Source location must be at most 255 characters")]
    string? SourceLocation,

    [StringLength(500, ErrorMessage = "Source URL must be at most 500 characters")]
    [Url(ErrorMessage = "Source URL must be a valid URL")]
    string? SourceUrl,

    [StringLength(10, ErrorMessage = "Display unit must be at most 10 characters")]
    string? DisplayUnit,

    string? Status,

    [StringLength(255, ErrorMessage = "Storage location must be at most 255 characters")]
    string? StorageLocation,

    [StringLength(2000, ErrorMessage = "Notes must be at most 2000 characters")]
    string? Notes,

    bool? IsFavorite,

    IEnumerable<CreateInventorySpecimenRequest>? Specimens
);

public record UpdateInventoryRequest(
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [Required(ErrorMessage = "Acquired date is required")]
    DateOnly AcquiredDate,

    [Required(ErrorMessage = "Source type is required")]
    string SourceType,

    [StringLength(255, ErrorMessage = "Source name must be at most 255 characters")]
    string? SourceName,

    [StringLength(255, ErrorMessage = "Source location must be at most 255 characters")]
    string? SourceLocation,

    [StringLength(500, ErrorMessage = "Source URL must be at most 500 characters")]
    [Url(ErrorMessage = "Source URL must be a valid URL")]
    string? SourceUrl,

    [StringLength(10, ErrorMessage = "Display unit must be at most 10 characters")]
    string? DisplayUnit,

    string? Status,

    [StringLength(255, ErrorMessage = "Storage location must be at most 255 characters")]
    string? StorageLocation,

    [StringLength(2000, ErrorMessage = "Notes must be at most 2000 characters")]
    string? Notes,

    bool? IsFavorite,

    IEnumerable<CreateInventorySpecimenRequest>? Specimens
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
    string? Notes
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
