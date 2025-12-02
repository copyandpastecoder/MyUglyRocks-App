using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface ITumblerService
{
    Task<IEnumerable<TumblerListDto>> GetUserTumblersAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TumblerDto?> GetTumblerAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<TumblerDto> CreateTumblerAsync(Guid userId, CreateTumblerRequest request, CancellationToken cancellationToken = default);
    Task<TumblerDto?> UpdateTumblerAsync(Guid id, Guid userId, UpdateTumblerRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteTumblerAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<BarrelDto?> AddBarrelAsync(Guid tumblerId, Guid userId, CreateBarrelRequest request, CancellationToken cancellationToken = default);
    Task<BarrelDto?> UpdateBarrelAsync(Guid barrelId, Guid userId, UpdateBarrelRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteBarrelAsync(Guid barrelId, Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<TumblerModelDto>> GetTumblerModelsAsync(CancellationToken cancellationToken = default);
}
