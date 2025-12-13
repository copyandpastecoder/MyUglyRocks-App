using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IInventoryService
{
    // Inventory CRUD
    Task<IEnumerable<InventoryListDto>> GetUserInventoryAsync(
        Guid userId,
        string? status = null,
        string? sourceType = null,
        Guid? specimenId = null,
        bool? favorites = null,
        string? search = null,
        string sortBy = "acquiredDate",
        string sortOrder = "desc",
        int skip = 0,
        int take = 20,
        CancellationToken cancellationToken = default);

    Task<InventoryDto?> GetInventoryAsync(Guid inventoryId, Guid userId, CancellationToken cancellationToken = default);
    Task<InventoryDto> CreateInventoryAsync(Guid userId, CreateInventoryRequest request, CancellationToken cancellationToken = default);
    Task<InventoryDto?> UpdateInventoryAsync(Guid inventoryId, Guid userId, UpdateInventoryRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteInventoryAsync(Guid inventoryId, Guid userId, CancellationToken cancellationToken = default);
    Task<InventoryDto?> UpdateInventoryStatusAsync(Guid inventoryId, Guid userId, UpdateInventoryStatusRequest request, CancellationToken cancellationToken = default);

    // Specimen operations
    Task<InventoryDto?> UpdateInventorySpecimensAsync(Guid inventoryId, Guid userId, UpdateInventorySpecimensRequest request, CancellationToken cancellationToken = default);

    // Stats
    Task<InventoryStatsDto> GetInventoryStatsAsync(Guid userId, CancellationToken cancellationToken = default);
}
