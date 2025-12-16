using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

public record InventorySourceDto(
    Guid InventorySourceId,
    string SourceType,
    string Name,
    string? Location,
    string? Phone,
    string? Url,
    string? ContactName,
    string? Notes,
    bool IsActive,
    DateTime DateCreated,
    DateTime DateUpdated,
    // Computed fields
    int TotalPurchases,
    DateOnly? LastPurchaseDate
);

public record InventorySourceListDto(
    Guid InventorySourceId,
    string SourceType,
    string Name,
    string? Location,
    bool IsActive,
    int TotalPurchases,
    DateOnly? LastPurchaseDate
);

public record CreateInventorySourceRequest(
    [Required(ErrorMessage = "Source type is required")]
    string SourceType,

    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [StringLength(255, ErrorMessage = "Location must be at most 255 characters")]
    string? Location,

    [StringLength(50, ErrorMessage = "Phone must be at most 50 characters")]
    string? Phone,

    [StringLength(500, ErrorMessage = "URL must be at most 500 characters")]
    string? Url,

    [StringLength(255, ErrorMessage = "Contact name must be at most 255 characters")]
    string? ContactName,

    [StringLength(2000, ErrorMessage = "Notes must be at most 2000 characters")]
    string? Notes
);

public record UpdateInventorySourceRequest(
    [Required(ErrorMessage = "Source type is required")]
    string SourceType,

    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [StringLength(255, ErrorMessage = "Location must be at most 255 characters")]
    string? Location,

    [StringLength(50, ErrorMessage = "Phone must be at most 50 characters")]
    string? Phone,

    [StringLength(500, ErrorMessage = "URL must be at most 500 characters")]
    string? Url,

    [StringLength(255, ErrorMessage = "Contact name must be at most 255 characters")]
    string? ContactName,

    [StringLength(2000, ErrorMessage = "Notes must be at most 2000 characters")]
    string? Notes,

    bool? IsActive
);
