namespace MyUglyRocks.Abstractions.DTOs;

public record CycleDto(
    Guid Id,
    string Name,
    DateOnly StartDate,
    DateOnly? EndDate,
    string Status,
    string? Goal,
    int? DifficultyRating,
    int? FinalQuality,
    string? AdditionalSpecimens,
    string? Notes,
    DateTime DateCreated,
    IEnumerable<StageRunSummaryDto> StageRuns,
    IEnumerable<SpecimenDto> Specimens
);

public record CycleListDto(
    Guid Id,
    string Name,
    DateOnly StartDate,
    DateOnly? EndDate,
    string Status,
    string? Goal,
    int? DifficultyRating,
    int StageCount,
    int ActiveStageCount,
    bool IsOverdue,
    DateTime DateCreated
);

public record CreateCycleRequest(
    string Name,
    DateOnly StartDate,
    string? Goal,
    int? DifficultyRating,
    string? AdditionalSpecimens,
    string? Notes,
    Guid[]? SpecimenIds
);

public record UpdateCycleRequest(
    string Name,
    DateOnly StartDate,
    string? Goal,
    int? DifficultyRating,
    string? AdditionalSpecimens,
    string? Notes
);

public record CompleteCycleRequest(
    int? FinalQuality,
    string? Notes
);

public record StageRunSummaryDto(
    Guid Id,
    string StageName,
    int RunNumber,
    int TotalRuns,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string Status,
    int? ResultRating,
    CleaningRunDto? CleaningRun
);

public record StageRunDto(
    Guid Id,
    Guid CycleId,
    string StageName,
    int RunNumber,
    int TotalRuns,
    DateTime StartDateTime,
    int DurationDays,
    int DurationHours,
    DateTime EndDateTime,
    string Status,
    bool ReminderEnabled,
    decimal? LoadWeightBeforeGrams,
    int? FillLevelPercent,
    string? WaterLevel,
    int? WaterAmountMl,
    int? ResultRating,
    string? NextAction,
    string? Notes,
    DateTime DateCreated,
    IEnumerable<BarrelDto> Barrels,
    CleaningRunDto? CleaningRun,
    IEnumerable<StageMaterialDto> Materials,
    IEnumerable<PhotoDto> Photos
);

public record CreateStageRunRequest(
    Guid[] BarrelIds,
    string StageName,
    DateTime StartDateTime,
    int DurationDays,
    int DurationHours,
    bool ReminderEnabled,
    int? RemindAfterDays,
    bool? RemindAtEndOfStage,
    decimal? LoadWeightBeforeGrams,
    int? FillLevelPercent,
    string? WaterLevel,
    int? WaterAmountMl,
    string? Notes,
    IEnumerable<CreateStageMaterialRequest>? Materials,
    CreateCleaningRunRequest? CleaningRun
);

public record UpdateStageRunRequest(
    Guid[]? BarrelIds,
    string StageName,
    DateTime StartDateTime,
    int DurationDays,
    int DurationHours,
    bool ReminderEnabled,
    int? RemindAfterDays,
    bool? RemindAtEndOfStage,
    decimal? LoadWeightBeforeGrams,
    decimal? LoadWeightAfterGrams,
    int? FillLevelPercent,
    string? WaterLevel,
    int? WaterAmountMl,
    string? Notes
);

public record CompleteStageRunRequest(
    int? ResultRating,
    int? ResultShapeRounding,
    int? ResultScratchLevel,
    int? ResultPitting,
    int? ResultShine,
    bool? IssueScratches,
    bool? IssueChips,
    bool? IssueUnderRounded,
    bool? IssueContamination,
    string? LessonsLearned,
    string? NextAction,
    decimal? LoadWeightAfterGrams,
    DateTime? ActualEndDateTime
);

public record CleaningRunDto(
    Guid Id,
    int DurationMinutes,
    string? Purpose,
    string Status,
    string? ResultNotes,
    string? Notes,
    IEnumerable<CleaningMaterialDto> Materials
);

public record CreateCleaningRunRequest(
    int DurationMinutes,
    string? Purpose,
    bool ReminderEnabled,
    string? Notes,
    IEnumerable<CreateCleaningMaterialRequest>? Materials
);

public record StageMaterialDto(
    Guid Id,
    Guid MaterialId,
    string MaterialName,
    decimal? DisplayAmount,
    string? DisplayUnit,
    int SortOrder
);

public record CreateStageMaterialRequest(
    Guid MaterialId,
    decimal? DisplayAmount,
    string? DisplayUnit
);

public record CleaningMaterialDto(
    Guid Id,
    Guid MaterialId,
    string MaterialName,
    decimal? DisplayAmount,
    string? DisplayUnit,
    int SortOrder
);

public record CreateCleaningMaterialRequest(
    Guid MaterialId,
    decimal? DisplayAmount,
    string? DisplayUnit
);

public record PhotoDto(
    Guid Id,
    string Url,
    string? FileName,
    string PhotoType,
    string? Caption,
    int SortOrder,
    DateTime DateCreated,
    string? ThumbnailUrl = null,
    string? MediumUrl = null,
    string? LargeUrl = null,
    string? BlurHash = null,
    int? Width = null,
    int? Height = null
);

public record SpecimenDto(
    Guid Id,
    string CommonName,
    string? ScientificName,
    string MaterialType,
    decimal? MohsHardnessMin,
    decimal? MohsHardnessMax,
    string? TumblingDifficulty
);

public record MaterialDto(
    Guid Id,
    string CommonName,
    string Category,
    string? MaterialType,
    string? MaterialSize,
    string? UsageType,
    int MeshSize,
    bool IsCleaning,
    bool IsActive
);

/// <summary>
/// Photo with stage context for cycle photo selection
/// </summary>
public record CyclePhotoDto(
    Guid Id,
    string Url,
    string? FileName,
    string PhotoType,
    string? Caption,
    int SortOrder,
    DateTime DateCreated,
    string? ThumbnailUrl,
    string? MediumUrl,
    string? LargeUrl,
    string? BlurHash,
    int? Width,
    int? Height,
    // Stage context
    Guid StageRunId,
    string StageName,
    int RunNumber
);
