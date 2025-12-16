using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IInventorySourceService
{
    /// <summary>
    /// Gets all inventory sources for a user, with optional filters.
    /// </summary>
    Task<IEnumerable<InventorySourceListDto>> GetUserSourcesAsync(
        Guid userId,
        string? sourceType = null,
        bool? isActive = null,
        string? search = null,
        string sortBy = "name",
        string sortOrder = "asc",
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific inventory source by ID.
    /// </summary>
    Task<InventorySourceDto?> GetSourceAsync(Guid sourceId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new inventory source.
    /// Returns null if a source with the same name and type already exists.
    /// </summary>
    Task<InventorySourceDto?> CreateSourceAsync(Guid userId, CreateInventorySourceRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing inventory source.
    /// Returns null if source not found or if name change would create duplicate.
    /// </summary>
    Task<InventorySourceDto?> UpdateSourceAsync(Guid sourceId, Guid userId, UpdateInventorySourceRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an inventory source.
    /// Returns false if source not found or has linked inventory items.
    /// </summary>
    Task<bool> DeleteSourceAsync(Guid sourceId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a source name already exists for the user and source type.
    /// </summary>
    Task<bool> SourceNameExistsAsync(Guid userId, string sourceType, string name, Guid? excludeSourceId = null, CancellationToken cancellationToken = default);
}
