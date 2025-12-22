using System.ComponentModel.DataAnnotations;

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
    DateTime DateCreated,
    // Active stage progress info (null if no active stages)
    DateTime? ActiveStageStartDateTime = null,
    DateTime? ActiveStageDurationEstimateEndDate = null,
    int? ActiveStageDaysOverdue = null,
    // Active tumbler/barrel info (from most recent active stage, or most recent completed stage if no active)
    string? ActiveTumblerName = null,
    int? ActiveTumblerNumber = null,
    bool HasDuplicateTumbler = false,
    int? ActiveBarrelNumber = null,
    string? ActiveBarrelNickname = null
);

public record CreateCycleRequest(
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [Required(ErrorMessage = "Start date is required")]
    DateOnly StartDate,

    [Range(1, 5, ErrorMessage = "Difficulty rating must be between 1 and 5")]
    int? DifficultyRating,

    [StringLength(500, ErrorMessage = "Additional specimens must be at most 500 characters")]
    string? AdditionalSpecimens,

    [StringLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    string? Notes,

    /// <summary>System specimen IDs (from reference data)</summary>
    Guid[]? SpecimenIds,

    /// <summary>User specimen IDs (custom user-created specimens)</summary>
    Guid[]? UserSpecimenIds,

    /// <summary>Inventory specimens (from user's inventory) with options for status management</summary>
    InventorySpecimenInput[]? InventorySpecimens
);

/// <summary>
/// Input for selecting a specimen from inventory with options for status management
/// </summary>
public record InventorySpecimenInput(
    /// <summary>The inventory specimen ID to link to the cycle</summary>
    Guid InventorySpecimenId,

    /// <summary>If true, mark the specimen as Depleted when the cycle completes</summary>
    bool MarkDepletedOnComplete = false,

    /// <summary>If true, copy tagged photos from inventory to the cycle when the first stage is created</summary>
    bool AddPhotosFromInventory = false
);

public record UpdateCycleRequest(
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    string Name,

    [Required(ErrorMessage = "Start date is required")]
    DateOnly StartDate,

    [Range(1, 5, ErrorMessage = "Difficulty rating must be between 1 and 5")]
    int? DifficultyRating,

    [StringLength(500, ErrorMessage = "Additional specimens must be at most 500 characters")]
    string? AdditionalSpecimens,

    [StringLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    string? Notes,

    /// <summary>System specimen IDs to add (from reference data)</summary>
    Guid[]? SpecimenIds = null,

    /// <summary>User specimen IDs to add (custom user-created specimens)</summary>
    Guid[]? UserSpecimenIds = null,

    /// <summary>Inventory specimens to add (from user's inventory) with options for status management</summary>
    InventorySpecimenInput[]? InventorySpecimens = null,

    /// <summary>Specimen IDs to remove from the cycle (system specimens)</summary>
    Guid[]? RemovedSpecimenIds = null,

    /// <summary>User specimen IDs to remove from the cycle</summary>
    Guid[]? RemovedUserSpecimenIds = null,

    /// <summary>Inventory specimen IDs to remove from the cycle</summary>
    Guid[]? RemovedInventorySpecimenIds = null
);

public record CompleteCycleRequest(
    [Range(1, 5, ErrorMessage = "Final quality must be between 1 and 5")]
    int? FinalQuality,

    [StringLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    string? Notes
);

public record StageRunSummaryDto(
    Guid StageRunId,
    string StageName,
    int RunNumber,
    int TotalRuns,
    DateTime StartDateTime,
    DateTime? EndDateTime,  // Actual end - only set when completed/aborted
    DateTime? DurationEstimateEndDate,  // Calculated estimate based on duration
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
    DateTime? EndDateTime,  // Actual end - only set when completed/aborted
    DateTime? DurationEstimateEndDate,  // Calculated estimate based on duration
    string Status,
    bool ReminderEnabled,
    int? RemindAfterDays,
    bool? RemindAtEndOfStage,
    decimal? LoadWeightBeforeGrams,
    decimal? LoadWeightAfterGrams,
    int? WaterAmountMl,
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
    string? Notes,
    DateTime DateCreated,
    IEnumerable<BarrelDto> Barrels,
    CleaningRunDto? CleaningRun,
    IEnumerable<StageMaterialDto> Materials,
    IEnumerable<PhotoDto> Photos
);

public record CreateStageRunRequest(
    [Required(ErrorMessage = "At least one barrel is required")]
    [MinLength(1, ErrorMessage = "At least one barrel is required")]
    Guid[] BarrelIds,

    [Required(ErrorMessage = "Stage name is required")]
    [StringLength(50, ErrorMessage = "Stage name must be at most 50 characters")]
    string StageName,

    [Required(ErrorMessage = "Start date/time is required")]
    DateTime StartDateTime,

    [Range(0, 365, ErrorMessage = "Duration days must be between 0 and 365")]
    int DurationDays,

    [Range(0, 23, ErrorMessage = "Duration hours must be between 0 and 23")]
    int DurationHours,

    bool ReminderEnabled,

    [Range(0, 365, ErrorMessage = "Remind after days must be between 0 and 365")]
    int? RemindAfterDays,

    bool? RemindAtEndOfStage,

    [Range(0, 100000, ErrorMessage = "Load weight must be between 0 and 100000 grams")]
    decimal? LoadWeightBeforeGrams,

    [Range(0, 10000, ErrorMessage = "Water amount must be between 0 and 10000 ml")]
    int? WaterAmountMl,

    [StringLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    string? Notes,

    IEnumerable<CreateStageMaterialRequest>? Materials,
    CreateCleaningRunRequest? CleaningRun
);

public record UpdateStageRunRequest(
    Guid[]? BarrelIds,

    [Required(ErrorMessage = "Stage name is required")]
    [StringLength(50, ErrorMessage = "Stage name must be at most 50 characters")]
    string StageName,

    [Required(ErrorMessage = "Start date/time is required")]
    DateTime StartDateTime,

    [Range(0, 365, ErrorMessage = "Duration days must be between 0 and 365")]
    int DurationDays,

    [Range(0, 23, ErrorMessage = "Duration hours must be between 0 and 23")]
    int DurationHours,

    bool ReminderEnabled,

    [Range(0, 365, ErrorMessage = "Remind after days must be between 0 and 365")]
    int? RemindAfterDays,

    bool? RemindAtEndOfStage,

    [Range(0, 100000, ErrorMessage = "Load weight must be between 0 and 100000 grams")]
    decimal? LoadWeightBeforeGrams,

    [Range(0, 100000, ErrorMessage = "Load weight must be between 0 and 100000 grams")]
    decimal? LoadWeightAfterGrams,

    [Range(0, 10000, ErrorMessage = "Water amount must be between 0 and 10000 ml")]
    int? WaterAmountMl,

    [StringLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    string? Notes,

    // Quality ratings (added to allow editing like complete stage)
    [Range(1, 5, ErrorMessage = "Result rating must be between 1 and 5")]
    int? ResultRating,

    [Range(0, 100, ErrorMessage = "Shape rounding must be between 0 and 100")]
    int? ResultShapeRounding,

    [Range(0, 100, ErrorMessage = "Scratch level must be between 0 and 100")]
    int? ResultScratchLevel,

    [Range(0, 100, ErrorMessage = "Pitting must be between 0 and 100")]
    int? ResultPitting,

    [Range(0, 100, ErrorMessage = "Shine must be between 0 and 100")]
    int? ResultShine,

    // Issues
    bool? IssueScratches,
    bool? IssueChips,
    bool? IssueUnderRounded,
    bool? IssueContamination,

    // Lessons and next action
    [StringLength(2000, ErrorMessage = "Lessons learned must be at most 2000 characters")]
    string? LessonsLearned,

    [StringLength(500, ErrorMessage = "Next action must be at most 500 characters")]
    string? NextAction,

    IEnumerable<CreateStageMaterialRequest>? Materials,
    CreateCleaningRunRequest? CleaningRun
);

public record CompleteStageRunRequest(
    [Range(1, 5, ErrorMessage = "Result rating must be between 1 and 5")]
    int? ResultRating,

    [Range(0, 100, ErrorMessage = "Shape rounding must be between 0 and 100")]
    int? ResultShapeRounding,

    [Range(0, 100, ErrorMessage = "Scratch level must be between 0 and 100")]
    int? ResultScratchLevel,

    [Range(0, 100, ErrorMessage = "Pitting must be between 0 and 100")]
    int? ResultPitting,

    [Range(0, 100, ErrorMessage = "Shine must be between 0 and 100")]
    int? ResultShine,

    bool? IssueScratches,
    bool? IssueChips,
    bool? IssueUnderRounded,
    bool? IssueContamination,

    [StringLength(2000, ErrorMessage = "Lessons learned must be at most 2000 characters")]
    string? LessonsLearned,

    [StringLength(500, ErrorMessage = "Next action must be at most 500 characters")]
    string? NextAction,

    [Range(0, 100000, ErrorMessage = "Load weight must be between 0 and 100000 grams")]
    decimal? LoadWeightAfterGrams,

    DateTime? ActualEndDateTime
);

public record CleaningRunDto(
    Guid CleaningRunId,
    int DurationMinutes,
    string? Purpose,
    string Status,
    string? ResultNotes,
    IEnumerable<CleaningMaterialDto> Materials
);

public record CreateCleaningRunRequest(
    [Range(1, 1440, ErrorMessage = "Duration must be between 1 and 1440 minutes")]
    int DurationMinutes,

    [StringLength(200, ErrorMessage = "Purpose must be at most 200 characters")]
    string? Purpose,

    bool ReminderEnabled,

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
    [Required(ErrorMessage = "Material ID is required")]
    Guid MaterialId,

    [Range(0, 100000, ErrorMessage = "Amount must be between 0 and 100000")]
    decimal? DisplayAmount,

    [StringLength(20, ErrorMessage = "Unit must be at most 20 characters")]
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
    [Required(ErrorMessage = "Material ID is required")]
    Guid MaterialId,

    [Range(0, 100000, ErrorMessage = "Amount must be between 0 and 100000")]
    decimal? DisplayAmount,

    [StringLength(20, ErrorMessage = "Unit must be at most 20 characters")]
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
    int? Height = null,
    string ProcessingStatus = "Completed",  // Processing, Completed, Failed
    string? ProcessingError = null
);

public record SpecimenDto(
    Guid SpecimenId,
    string CommonName,
    string? ScientificName,
    string MaterialType,
    decimal? MohsHardnessMin,
    decimal? MohsHardnessMax,
    string? TumblingDifficulty,
    /// <summary>Source: "system" for reference specimens, "user" for custom user specimens</summary>
    string Source = "system",
    /// <summary>Only set for user specimens - the user who created it</summary>
    Guid? UserId = null,
    /// <summary>Set when the specimen was linked via inventory</summary>
    Guid? InventorySpecimenId = null
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
    string ProcessingStatus,
    // Stage context
    Guid StageRunId,
    string StageName,
    int RunNumber
);
