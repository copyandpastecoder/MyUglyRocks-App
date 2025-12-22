namespace MyUglyRocks.Abstractions.DTOs;

/// <summary>
/// Comprehensive cycle statistics for dashboard display
/// </summary>
public record CycleStatisticsDto(
    DurationStatsDto DurationStats,
    WeightStatsDto WeightStats,
    OperationalStatsDto OperationalStats,
    IEnumerable<TumblerStatsDto> TumblerStats,
    IEnumerable<BarrelStatsDto> BarrelStats,
    SpecimenStatsDto SpecimenStats,
    OverdueStatsDto OverdueStats,
    ActivityStatsDto ActivityStats
);

/// <summary>
/// Duration statistics for cycles and stages
/// </summary>
public record DurationStatsDto(
    double? AvgCycleDurationDays,
    double? AvgStage1DurationDays,
    double? AvgStage2DurationDays,
    double? AvgStage3DurationDays,
    double? AvgStage4DurationDays,
    int? FastestCycleDays,
    int? LongestCycleDays,
    IEnumerable<TumblerDurationStatsDto> PerTumblerDurations
);

/// <summary>
/// Duration statistics per tumbler
/// </summary>
public record TumblerDurationStatsDto(
    Guid TumblerId,
    string TumblerName,
    double? AvgCycleDurationDays,
    double? AvgStage1DurationDays,
    double? AvgStage2DurationDays,
    double? AvgStage3DurationDays,
    double? AvgStage4DurationDays
);

/// <summary>
/// Weight loss statistics per stage and by hardness
/// </summary>
public record WeightStatsDto(
    double? AvgStage1WeightLossPercent,
    double? AvgStage2WeightLossPercent,
    double? AvgStage3WeightLossPercent,
    double? AvgStage4WeightLossPercent,
    double? AvgTotalWeightLossPercent,
    StageWeightDto? AvgStage1Weight,
    StageWeightDto? AvgStage2Weight,
    StageWeightDto? AvgStage3Weight,
    StageWeightDto? AvgStage4Weight,
    IEnumerable<HardnessWeightLossDto> WeightLossByHardness
);

/// <summary>
/// Average weight before/after for a stage
/// </summary>
public record StageWeightDto(
    double? AvgWeightBeforeGrams,
    double? AvgWeightAfterGrams,
    double? AvgWeightLossGrams
);

/// <summary>
/// Weight loss statistics grouped by specimen hardness
/// </summary>
public record HardnessWeightLossDto(
    string HardnessCategory,
    double? AvgWeightLossPercent,
    int CycleCount
);

/// <summary>
/// Operational statistics (runtime, completion rate, overdue)
/// </summary>
public record OperationalStatsDto(
    double TotalRuntimeHours,
    double? AvgRuntimePerCycleHours,
    double CompletionRate,
    int CurrentlyOverdueCount
);

/// <summary>
/// Per-tumbler performance statistics
/// </summary>
public record TumblerStatsDto(
    Guid TumblerId,
    string TumblerName,
    int CycleCount,
    double? AvgCycleHours,
    double? AvgIdleTimeDays
);

/// <summary>
/// Per-barrel usage statistics
/// </summary>
public record BarrelStatsDto(
    Guid BarrelId,
    string BarrelName,
    string TumblerName,
    int CycleCount,
    double TotalHours
);

/// <summary>
/// Specimen statistics
/// </summary>
public record SpecimenStatsDto(
    double? AvgSpecimensPerCycle,
    int TotalSpecimensProcessed,
    IEnumerable<RockTypeCountDto> MostCommonTypes
);

/// <summary>
/// Rock type count for most common specimens
/// </summary>
public record RockTypeCountDto(
    string RockType,
    int Count
);

/// <summary>
/// Overdue analysis statistics
/// </summary>
public record OverdueStatsDto(
    string? MostOverdueStageType,
    double? AvgDaysOverEstimate,
    double OnTimeCompletionRate
);

/// <summary>
/// Activity pattern statistics
/// </summary>
public record ActivityStatsDto(
    int MaxConcurrentCycles,
    double AvgConcurrentCycles,
    IEnumerable<MonthlyActivityDto> CyclesPerMonth
);

/// <summary>
/// Monthly activity data point
/// </summary>
public record MonthlyActivityDto(
    int Year,
    int Month,
    int CyclesStarted,
    int CyclesCompleted
);
