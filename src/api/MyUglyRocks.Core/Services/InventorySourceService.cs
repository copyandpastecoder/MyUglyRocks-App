using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class InventorySourceService : IInventorySourceService
{
    private readonly DbContext _context;

    public InventorySourceService(DbContext context)
    {
        _context = context;
    }

    private DbSet<InventorySource> Sources => _context.Set<InventorySource>();
    private DbSet<Inventory> Inventories => _context.Set<Inventory>();

    public async Task<IEnumerable<InventorySourceListDto>> GetUserSourcesAsync(
        Guid userId,
        string? sourceType = null,
        bool? isActive = null,
        string? search = null,
        string sortBy = "name",
        string sortOrder = "asc",
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        var query = Sources
            .Include(s => s.Inventories.Where(i => !i.IsDeleted))
            .Where(s => s.UserId == userId);

        // Apply filters
        if (!string.IsNullOrEmpty(sourceType) && Enum.TryParse<InventorySourceType>(sourceType, true, out var srcType))
        {
            query = query.Where(s => s.SourceType == srcType);
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(searchLower)
                || (s.Location != null && s.Location.ToLower().Contains(searchLower))
                || (s.ContactName != null && s.ContactName.ToLower().Contains(searchLower)));
        }

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "sourcetype" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.SourceType) : query.OrderByDescending(s => s.SourceType),
            "location" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.Location) : query.OrderByDescending(s => s.Location),
            "totalpurchases" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(s => s.Inventories.Count)
                : query.OrderByDescending(s => s.Inventories.Count),
            "lastpurchasedate" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(s => s.Inventories.Max(i => (DateOnly?)i.AcquiredDate))
                : query.OrderByDescending(s => s.Inventories.Max(i => (DateOnly?)i.AcquiredDate)),
            "datecreated" => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.DateCreated) : query.OrderByDescending(s => s.DateCreated),
            _ => sortOrder.ToLower() == "asc" ? query.OrderBy(s => s.Name) : query.OrderByDescending(s => s.Name)
        };

        // Apply pagination
        var items = await query
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);

        return items.Select(MapToInventorySourceListDto).ToList();
    }

    public async Task<InventorySourceDto?> GetSourceAsync(Guid sourceId, Guid userId, CancellationToken cancellationToken = default)
    {
        var source = await Sources
            .Include(s => s.Inventories.Where(i => !i.IsDeleted))
            .FirstOrDefaultAsync(s => s.InventorySourceId == sourceId && s.UserId == userId, cancellationToken);

        return source == null ? null : MapToInventorySourceDto(source);
    }

    public async Task<InventorySourceDto?> CreateSourceAsync(Guid userId, CreateInventorySourceRequest request, CancellationToken cancellationToken = default)
    {
        // Validate source type
        if (!Enum.TryParse<InventorySourceType>(request.SourceType, true, out var sourceType))
        {
            return null;
        }

        // Check for duplicate name
        if (await SourceNameExistsAsync(userId, request.SourceType, request.Name, null, cancellationToken))
        {
            return null;
        }

        var source = new InventorySource
        {
            UserId = userId,
            SourceType = sourceType,
            Name = request.Name.Trim(),
            Location = request.Location?.Trim(),
            Phone = request.Phone?.Trim(),
            Url = request.Url?.Trim(),
            ContactName = request.ContactName?.Trim(),
            Notes = request.Notes?.Trim(),
            IsActive = true
        };

        Sources.Add(source);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetSourceAsync(source.InventorySourceId, userId, cancellationToken);
    }

    public async Task<InventorySourceDto?> UpdateSourceAsync(Guid sourceId, Guid userId, UpdateInventorySourceRequest request, CancellationToken cancellationToken = default)
    {
        var source = await Sources
            .FirstOrDefaultAsync(s => s.InventorySourceId == sourceId && s.UserId == userId, cancellationToken);

        if (source == null)
            return null;

        // Validate source type
        if (!Enum.TryParse<InventorySourceType>(request.SourceType, true, out var sourceType))
        {
            return null;
        }

        // Check for duplicate name (excluding current source)
        if (await SourceNameExistsAsync(userId, request.SourceType, request.Name, sourceId, cancellationToken))
        {
            return null;
        }

        source.SourceType = sourceType;
        source.Name = request.Name.Trim();
        source.Location = request.Location?.Trim();
        source.Phone = request.Phone?.Trim();
        source.Url = request.Url?.Trim();
        source.ContactName = request.ContactName?.Trim();
        source.Notes = request.Notes?.Trim();
        source.IsActive = request.IsActive ?? source.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetSourceAsync(sourceId, userId, cancellationToken);
    }

    public async Task<bool> DeleteSourceAsync(Guid sourceId, Guid userId, CancellationToken cancellationToken = default)
    {
        var source = await Sources
            .FirstOrDefaultAsync(s => s.InventorySourceId == sourceId && s.UserId == userId, cancellationToken);

        if (source == null)
            return false;

        // Check for non-deleted linked inventory items (query filter already excludes deleted)
        var hasActiveInventory = await Inventories
            .AnyAsync(i => i.InventorySourceId == sourceId, cancellationToken);

        if (hasActiveInventory)
        {
            return false;
        }

        // Nullify the FK on soft-deleted inventory items to allow source deletion
        // Must use IgnoreQueryFilters() because Inventory has a global query filter for !IsDeleted
        var deletedInventory = await Inventories
            .IgnoreQueryFilters()
            .Where(i => i.InventorySourceId == sourceId && i.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var inv in deletedInventory)
        {
            inv.InventorySourceId = null;
        }

        Sources.Remove(source);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SourceNameExistsAsync(Guid userId, string sourceType, string name, Guid? excludeSourceId = null, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<InventorySourceType>(sourceType, true, out var srcType))
        {
            return false;
        }

        var normalizedName = name.Trim().ToLower();

        var query = Sources
            .Where(s => s.UserId == userId
                && s.SourceType == srcType
                && s.Name.ToLower().Trim() == normalizedName);

        if (excludeSourceId.HasValue)
        {
            query = query.Where(s => s.InventorySourceId != excludeSourceId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    private static InventorySourceListDto MapToInventorySourceListDto(InventorySource source)
    {
        var inventories = source.Inventories.ToList();
        return new InventorySourceListDto(
            source.InventorySourceId,
            source.SourceType.ToString(),
            source.Name,
            source.Location,
            source.IsActive,
            inventories.Count,
            inventories.Any() ? inventories.Max(i => i.AcquiredDate) : null
        );
    }

    private static InventorySourceDto MapToInventorySourceDto(InventorySource source)
    {
        var inventories = source.Inventories.ToList();
        return new InventorySourceDto(
            source.InventorySourceId,
            source.SourceType.ToString(),
            source.Name,
            source.Location,
            source.Phone,
            source.Url,
            source.ContactName,
            source.Notes,
            source.IsActive,
            source.DateCreated,
            source.DateUpdated,
            inventories.Count,
            inventories.Any() ? inventories.Max(i => i.AcquiredDate) : null
        );
    }
}
