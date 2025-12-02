namespace MyUglyRocks.Abstractions.DTOs;

// Export request/response DTOs
public record ExportCyclesRequest(
    DateOnly? StartDate = null,
    DateOnly? EndDate = null,
    string? Status = null // Active, Completed, Archived, or null for all
);

public record FullExportRequest(
    string Password // User must confirm password for GDPR export
);

public record ExportResponse(
    string FileName,
    string ContentType,
    byte[] Data
);

public record GdprExportRequest(
    string Password
);

public record GdprExportQueuedResponse(
    string Message,
    string ExportId,
    DateTime EstimatedCompletionTime
);

// CSV export records - flat structures for CSV generation
public record CycleCsvRow(
    Guid CycleId,
    string CycleName,
    string Status,
    DateOnly StartDate,
    DateOnly? EndDate,
    int? DifficultyRating,
    int? FinalQuality,
    string? Specimens,
    string? Goal,
    string? Notes,
    int TotalStages,
    int CompletedStages
);

public record StageCsvRow(
    Guid StageId,
    Guid CycleId,
    string CycleName,
    string StageName,
    string Status,
    DateTime StartDateTime,
    DateTime EndDateTime,
    int DurationDays,
    int DurationHours,
    string? BarrelName,
    decimal? LoadWeightBeforeGrams,
    decimal? LoadWeightAfterGrams,
    decimal? BarrelRpm,
    int? FillLevelPercent,
    string? WaterLevel,
    int? ResultRating,
    string? NextAction,
    string? Notes
);

public record TumblerCsvRow(
    Guid TumblerId,
    string Brand,
    string? Model,
    string TumblerType,
    bool IsActive,
    string? Notes,
    int BarrelCount,
    DateTime DateCreated
);

public record PostCsvRow(
    Guid PostId,
    string Title,
    string? Description,
    string Status,
    int VoteCount,
    int CommentCount,
    DateTime DateCreated,
    Guid LinkedCycleId,
    string? LinkedCycleName
);
