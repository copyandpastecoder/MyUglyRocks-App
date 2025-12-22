using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

public record TumblerDto(
    Guid TumblerId,
    string Brand,
    string? Model,
    string TumblerType,
    int TumblerNumber,
    bool HasDuplicateBrandModel,
    decimal? MotorCapacityLbs,
    bool IsMotorCapacityEditable,
    bool IsActive,
    string? Notes,
    DateTime DateCreated,
    IEnumerable<BarrelDto> Barrels
);

public record TumblerListDto(
    Guid TumblerId,
    string Brand,
    string? Model,
    string TumblerType,
    int TumblerNumber,
    bool HasDuplicateBrandModel,
    bool IsActive,
    int BarrelCount,
    DateTime DateCreated
);

public record CreateTumblerRequest(
    [Required(ErrorMessage = "Brand is required")]
    [StringLength(100, ErrorMessage = "Brand must be at most 100 characters")]
    string Brand,

    [StringLength(100, ErrorMessage = "Model must be at most 100 characters")]
    string? Model,

    [Required(ErrorMessage = "Tumbler type is required")]
    [StringLength(50, ErrorMessage = "Tumbler type must be at most 50 characters")]
    string TumblerType,

    [Range(0, 1000, ErrorMessage = "Motor capacity must be between 0 and 1000 lbs")]
    decimal? MotorCapacityLbs,

    [StringLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    string? Notes,

    IEnumerable<CreateBarrelRequest>? Barrels
);

public record UpdateTumblerRequest(
    [Required(ErrorMessage = "Brand is required")]
    [StringLength(100, ErrorMessage = "Brand must be at most 100 characters")]
    string Brand,

    [StringLength(100, ErrorMessage = "Model must be at most 100 characters")]
    string? Model,

    [Required(ErrorMessage = "Tumbler type is required")]
    [StringLength(50, ErrorMessage = "Tumbler type must be at most 50 characters")]
    string TumblerType,

    [Range(0, 1000, ErrorMessage = "Motor capacity must be between 0 and 1000 lbs")]
    decimal? MotorCapacityLbs,

    [StringLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    string? Notes,

    bool IsActive
);

public record BarrelDto(
    Guid BarrelId,
    int BarrelNumber,
    string? Nickname,
    decimal? CapacityLbs,
    decimal? DefaultGritAmountGrams,
    bool IsDedicated,
    string[]? DedicatedStages,
    bool IsActive,
    bool IsMounted,
    bool IsInActiveCycle,
    Guid? ActiveCycleId,
    string? ActiveCycleName
);

public record CreateBarrelRequest(
    [Range(1, 100, ErrorMessage = "Barrel number must be between 1 and 100")]
    int BarrelNumber,

    [StringLength(50, ErrorMessage = "Nickname must be at most 50 characters")]
    string? Nickname,

    [Range(0, 1000, ErrorMessage = "Capacity must be between 0 and 1000 lbs")]
    decimal? CapacityLbs,

    [Range(0, 10000, ErrorMessage = "Default grit amount must be between 0 and 10000 grams")]
    decimal? DefaultGritAmountGrams
);

public record UpdateBarrelRequest(
    [StringLength(50, ErrorMessage = "Nickname must be at most 50 characters")]
    string? Nickname,

    [Range(0, 1000, ErrorMessage = "Capacity must be between 0 and 1000 lbs")]
    decimal? CapacityLbs,

    [Range(0, 10000, ErrorMessage = "Default grit amount must be between 0 and 10000 grams")]
    decimal? DefaultGritAmountGrams,

    bool IsDedicated,
    string[]? DedicatedStages,
    bool IsActive
);

public record TumblerModelDto(
    Guid TumblerModelId,
    string Brand,
    string Model,
    string TumblerType,
    decimal? DefaultCapacityLbs,
    int DefaultBarrelCount,
    decimal? MotorCapacityLbs,
    bool IsCustomEntry
);
