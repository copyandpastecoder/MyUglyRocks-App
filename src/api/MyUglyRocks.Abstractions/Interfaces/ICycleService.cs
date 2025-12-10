using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface ICycleService
{
    Task<IEnumerable<CycleListDto>> GetUserCyclesAsync(Guid userId, string? status = null, CancellationToken cancellationToken = default);
    Task<CycleDto?> GetCycleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<CycleDto> CreateCycleAsync(Guid userId, CreateCycleRequest request, CancellationToken cancellationToken = default);
    Task<CycleDto?> UpdateCycleAsync(Guid id, Guid userId, UpdateCycleRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCycleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<CycleDto?> CompleteCycleAsync(Guid id, Guid userId, CompleteCycleRequest request, CancellationToken cancellationToken = default);
    Task<CycleDto?> ArchiveCycleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    // Stage Run operations
    Task<StageRunDto?> GetStageRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<StageRunDto?> AddStageRunAsync(Guid cycleId, Guid userId, CreateStageRunRequest request, CancellationToken cancellationToken = default);
    Task<StageRunDto?> UpdateStageRunAsync(Guid id, Guid userId, UpdateStageRunRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteStageRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<StageRunDto?> CompleteStageRunAsync(Guid id, Guid userId, CompleteStageRunRequest request, CancellationToken cancellationToken = default);

    // Cleaning Run operations
    Task<CleaningRunDto?> AddCleaningRunAsync(Guid stageRunId, Guid userId, CreateCleaningRunRequest request, CancellationToken cancellationToken = default);
    Task<bool> CompleteCleaningRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteCleaningRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    // Material operations
    Task<StageMaterialDto?> AddStageMaterialAsync(Guid stageRunId, Guid userId, CreateStageMaterialRequest request, CancellationToken cancellationToken = default);
    Task<bool> RemoveStageMaterialAsync(Guid stageRunId, Guid materialId, Guid userId, CancellationToken cancellationToken = default);

    // Photo operations
    Task<IEnumerable<CyclePhotoDto>> GetCyclePhotosAsync(Guid cycleId, Guid userId, CancellationToken cancellationToken = default);
}
