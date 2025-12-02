namespace MyUglyRocks.Abstractions.DTOs;

public record TumblerDto(
    Guid Id,
    string Brand,
    string? Model,
    string TumblerType,
    decimal? MotorCapacityLbs,
    bool IsMotorCapacityEditable,
    bool IsActive,
    string? Notes,
    DateTime DateCreated,
    IEnumerable<BarrelDto> Barrels
);

public record TumblerListDto(
    Guid Id,
    string Brand,
    string? Model,
    string TumblerType,
    bool IsActive,
    int BarrelCount,
    DateTime DateCreated
);

public record CreateTumblerRequest(
    string Brand,
    string? Model,
    string TumblerType,
    decimal? MotorCapacityLbs,
    string? Notes,
    IEnumerable<CreateBarrelRequest>? Barrels
);

public record UpdateTumblerRequest(
    string Brand,
    string? Model,
    string TumblerType,
    decimal? MotorCapacityLbs,
    string? Notes,
    bool IsActive
);

public record BarrelDto(
    Guid Id,
    int BarrelNumber,
    string? Nickname,
    decimal? CapacityLbs,
    decimal? DefaultGritAmountGrams,
    bool IsDedicated,
    string[]? DedicatedStages,
    bool IsActive,
    bool IsMounted
);

public record CreateBarrelRequest(
    int BarrelNumber,
    string? Nickname,
    decimal? CapacityLbs,
    decimal? DefaultGritAmountGrams
);

public record UpdateBarrelRequest(
    string? Nickname,
    decimal? CapacityLbs,
    decimal? DefaultGritAmountGrams,
    bool IsDedicated,
    string[]? DedicatedStages,
    bool IsActive
);

public record TumblerModelDto(
    Guid Id,
    string Brand,
    string Model,
    string TumblerType,
    decimal? DefaultCapacityLbs,
    int DefaultBarrelCount,
    decimal? MotorCapacityLbs,
    bool IsCustomEntry
);
