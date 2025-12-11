namespace MyUglyRocks.Abstractions.DTOs;

public record CycleDto(
    Guid CycleId,
    string Name,
    DateOnly StartDate,
    DateOnly? EndDate,
    string Status,
    int? DifficultyRating,
    int? FinalQuality,
    string? AdditionalSpecimens,
    string? Notes,
    DateTime DateCreated,
    IEnumerable<StageRunSummaryDto> StageRuns,
    IEnumerable<SpecimenDto> Specimens,
    // Computed fields
    int ElapsedDays,
    int TotalRuntimeHours,
    int CompletedStagesCount,
    string? ActiveStageName,
    DateTime? LastUpdated,
    decimal? WeightLossGrams,
    decimal? WeightLossPercent,
    int PhotoCount,
    // Gallery info
    Guid? PostId = null,
    int GalleryLikes = 0,
    // Tumbler/Barrel info (from most recent stage)
    string? TumblerName = null,
    string? BarrelName = null
);

public record CycleListDto(
    Guid CycleId,
    string Name,
    DateOnly StartDate,
    DateOnly? EndDate,
    string Status,
    int? DifficultyRating,
    int StageCount,
    int ActiveStageCount,
    bool IsOverdue,
    DateTime DateCreated
);

public record CreateCycleRequest(
    string Name,
    DateOnly StartDate,
    int? DifficultyRating,
    string? AdditionalSpecimens,
    string? Notes,
    Guid[]? SpecimenIds
);

public record UpdateCycleRequest(
    string Name,
    DateOnly StartDate,
    int? DifficultyRating,
    string? AdditionalSpecimens,
    string? Notes
);

public record CompleteCycleRequest(
    int? FinalQuality,
    string? Notes
);

public record StageRunSummaryDto(
    Guid StageRunId,
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
    Guid StageRunId,
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
    decimal? LoadWeightAfterGrams,
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
    Guid CleaningRunId,
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
    Guid StageMaterialId,
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
    Guid CleaningMaterialId,
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
    Guid PhotoId,
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
    Guid SpecimenId,
    string CommonName,
    string? ScientificName,
    string MaterialType,
    decimal? MohsHardnessMin,
    decimal? MohsHardnessMax,
    string? TumblingDifficulty
);

public record MaterialDto(
    Guid MaterialId,
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
    Guid PhotoId,
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
