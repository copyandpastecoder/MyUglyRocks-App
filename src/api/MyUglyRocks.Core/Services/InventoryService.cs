using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class InventoryService : IInventoryService
{
    private readonly DbContext _context;

    public InventoryService(DbContext context)
    {
        _context = context;
    }

    private DbSet<Inventory> Inventories => _context.Set<Inventory>();
    private DbSet<InventorySpecimen> InventorySpecimens => _context.Set<InventorySpecimen>();
    private DbSet<Specimen> Specimens => _context.Set<Specimen>();
    private DbSet<UserSpecimen> UserSpecimens => _context.Set<UserSpecimen>();

    public async Task<IEnumerable<InventoryListDto>> GetUserInventoryAsync(
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
        CancellationToken cancellationToken = default)
    {
        var query = Inventories
            .Include(i => i.InventorySource)
            .Include(i => i.InventorySpecimens)
            .Include(i => i.InventoryPhotos)
            .Where(i => i.UserId == userId);

        // Apply filters
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InventoryStatus>(status, true, out var inventoryStatus))
        {
            query = query.Where(i => i.Status == inventoryStatus);
        }

        if (!string.IsNullOrEmpty(sourceType) && Enum.TryParse<SourceType>(sourceType, true, out var srcType))
        {
            query = query.Where(i => i.SourceType == srcType);
        }

        if (specimenId.HasValue)
        {
            query = query.Where(i => i.InventorySpecimens.Any(s => s.SpecimenId == specimenId));
        }

        if (favorites == true)
        {
            query = query.Where(i => i.IsFavorite);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(searchLower));
        }

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "name" => sortOrder.ToLower() == "asc" ? query.OrderBy(i => i.Name) : query.OrderByDescending(i => i.Name),
            "weight" => sortOrder.ToLower() == "asc" ? query.OrderBy(i => i.TotalWeightGrams) : query.OrderByDescending(i => i.TotalWeightGrams),
            "cost" => sortOrder.ToLower() == "asc" ? query.OrderBy(i => i.Cost) : query.OrderByDescending(i => i.Cost),
            "datecreated" => sortOrder.ToLower() == "asc" ? query.OrderBy(i => i.DateCreated) : query.OrderByDescending(i => i.DateCreated),
            _ => sortOrder.ToLower() == "asc" ? query.OrderBy(i => i.AcquiredDate) : query.OrderByDescending(i => i.AcquiredDate)
        };

        // Apply pagination
        var items = await query
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);

        return items.Select(MapToInventoryListDto).ToList();
    }

    public async Task<InventoryDto?> GetInventoryAsync(Guid inventoryId, Guid userId, CancellationToken cancellationToken = default)
    {
        var inventory = await Inventories
            .Include(i => i.InventorySource)
            .Include(i => i.InventorySpecimens)
                .ThenInclude(s => s.Specimen)
            .Include(i => i.InventorySpecimens)
                .ThenInclude(s => s.UserSpecimen)
            .Include(i => i.InventoryPhotos)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && i.UserId == userId, cancellationToken);

        return inventory == null ? null : MapToInventoryDto(inventory);
    }

    public async Task<InventoryDto> CreateInventoryAsync(Guid userId, CreateInventoryRequest request, CancellationToken cancellationToken = default)
    {
        var inventory = new Inventory
        {
            UserId = userId,
            Name = request.Name,
            AcquiredDate = request.AcquiredDate,
            InventorySourceId = request.InventorySourceId,
            DisplayUnit = request.DisplayUnit ?? "g",
            StorageLocation = request.StorageLocation,
            Notes = request.Notes,
            // Legacy fields - still set for backwards compatibility
            SourceType = string.IsNullOrEmpty(request.SourceType) ? SourceType.Other : Enum.Parse<SourceType>(request.SourceType, true),
            SourceName = request.SourceName,
            SourceLocation = request.SourceLocation,
            SourceUrl = request.SourceUrl,
            Status = string.IsNullOrEmpty(request.Status) ? InventoryStatus.Available : Enum.Parse<InventoryStatus>(request.Status, true),
            IsFavorite = request.IsFavorite ?? false
        };

        Inventories.Add(inventory);
        await _context.SaveChangesAsync(cancellationToken);

        // Add specimens if provided
        if (request.Specimens != null && request.Specimens.Any())
        {
            foreach (var specimenRequest in request.Specimens)
            {
                var inventorySpecimen = new InventorySpecimen
                {
                    InventoryId = inventory.InventoryId,
                    SpecimenId = specimenRequest.SpecimenId,
                    UserSpecimenId = specimenRequest.UserSpecimenId,
                    WeightGrams = specimenRequest.WeightGrams,
                    Cost = specimenRequest.Cost,
                    Condition = string.IsNullOrEmpty(specimenRequest.Condition)
                        ? InventoryCondition.Raw
                        : Enum.Parse<InventoryCondition>(specimenRequest.Condition, true),
                    QualityRating = specimenRequest.QualityRating,
                    SizeCategories = specimenRequest.SizeCategories != null && specimenRequest.SizeCategories.Length > 0
                        ? string.Join(",", specimenRequest.SizeCategories)
                        : null,
                    Notes = specimenRequest.Notes,
                    Status = string.IsNullOrEmpty(specimenRequest.Status) ? InventoryStatus.Available : Enum.Parse<InventoryStatus>(specimenRequest.Status, true),
                    StorageLocation = specimenRequest.StorageLocation,
                    Url = specimenRequest.Url
                };
                InventorySpecimens.Add(inventorySpecimen);
            }
            await _context.SaveChangesAsync(cancellationToken);

            // Reload and recalculate aggregates
            inventory = await Inventories
                .Include(i => i.InventorySpecimens)
                .FirstOrDefaultAsync(i => i.InventoryId == inventory.InventoryId, cancellationToken);

            if (inventory != null)
            {
                RecalculateAggregatesFromSpecimens(inventory);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return (await GetInventoryAsync(inventory!.InventoryId, userId, cancellationToken))!;
    }

    public async Task<InventoryDto?> UpdateInventoryAsync(Guid inventoryId, Guid userId, UpdateInventoryRequest request, CancellationToken cancellationToken = default)
    {
        var inventory = await Inventories
            .Include(i => i.InventorySpecimens)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && i.UserId == userId, cancellationToken);

        if (inventory == null)
            return null;

        inventory.Name = request.Name;
        inventory.AcquiredDate = request.AcquiredDate;
        inventory.InventorySourceId = request.InventorySourceId;
        inventory.DisplayUnit = request.DisplayUnit ?? "g";
        inventory.StorageLocation = request.StorageLocation;
        inventory.Notes = request.Notes;
        // Legacy fields - still set for backwards compatibility
        if (!string.IsNullOrEmpty(request.SourceType))
            inventory.SourceType = Enum.Parse<SourceType>(request.SourceType, true);
        inventory.SourceName = request.SourceName;
        inventory.SourceLocation = request.SourceLocation;
        inventory.SourceUrl = request.SourceUrl;
        inventory.Status = string.IsNullOrEmpty(request.Status) ? inventory.Status : Enum.Parse<InventoryStatus>(request.Status, true);
        inventory.IsFavorite = request.IsFavorite ?? inventory.IsFavorite;

        // Update specimens if provided
        if (request.Specimens != null)
        {
            // Remove existing specimens
            InventorySpecimens.RemoveRange(inventory.InventorySpecimens);

            // Add new specimens using Select for cleaner mapping
            var newSpecimens = request.Specimens.Select(specimenRequest => new InventorySpecimen
            {
                InventoryId = inventoryId,
                SpecimenId = specimenRequest.SpecimenId,
                UserSpecimenId = specimenRequest.UserSpecimenId,
                WeightGrams = specimenRequest.WeightGrams,
                Cost = specimenRequest.Cost,
                Condition = string.IsNullOrEmpty(specimenRequest.Condition)
                    ? InventoryCondition.Raw
                    : Enum.Parse<InventoryCondition>(specimenRequest.Condition, true),
                QualityRating = specimenRequest.QualityRating,
                SizeCategories = specimenRequest.SizeCategories != null && specimenRequest.SizeCategories.Length > 0
                    ? string.Join(",", specimenRequest.SizeCategories)
                    : null,
                Notes = specimenRequest.Notes,
                Status = string.IsNullOrEmpty(specimenRequest.Status) ? InventoryStatus.Available : Enum.Parse<InventoryStatus>(specimenRequest.Status, true),
                StorageLocation = specimenRequest.StorageLocation,
                Url = specimenRequest.Url
            });
            InventorySpecimens.AddRange(newSpecimens);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Reload inventory with new specimens to recalculate aggregates
        inventory = await Inventories
            .Include(i => i.InventorySpecimens)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId, cancellationToken);

        if (inventory != null)
        {
            RecalculateAggregatesFromSpecimens(inventory);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await GetInventoryAsync(inventoryId, userId, cancellationToken);
    }

    public async Task<bool> DeleteInventoryAsync(Guid inventoryId, Guid userId, CancellationToken cancellationToken = default)
    {
        var inventory = await Inventories
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && i.UserId == userId, cancellationToken);

        if (inventory == null)
            return false;

        // Soft delete - handled by SaveChangesAsync override
        Inventories.Remove(inventory);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<InventoryDto?> UpdateInventoryStatusAsync(Guid inventoryId, Guid userId, UpdateInventoryStatusRequest request, CancellationToken cancellationToken = default)
    {
        var inventory = await Inventories
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && i.UserId == userId, cancellationToken);

        if (inventory == null)
            return null;

        inventory.Status = Enum.Parse<InventoryStatus>(request.Status, true);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetInventoryAsync(inventoryId, userId, cancellationToken);
    }

    public async Task<InventoryDto?> UpdateInventorySpecimensAsync(Guid inventoryId, Guid userId, UpdateInventorySpecimensRequest request, CancellationToken cancellationToken = default)
    {
        var inventory = await Inventories
            .Include(i => i.InventorySpecimens)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && i.UserId == userId, cancellationToken);

        if (inventory == null)
            return null;

        // Remove existing specimens
        InventorySpecimens.RemoveRange(inventory.InventorySpecimens);

        // Add new specimens
        foreach (var specimenRequest in request.Specimens)
        {
            var inventorySpecimen = new InventorySpecimen
            {
                InventoryId = inventoryId,
                SpecimenId = specimenRequest.SpecimenId,
                UserSpecimenId = specimenRequest.UserSpecimenId,
                WeightGrams = specimenRequest.WeightGrams,
                Cost = specimenRequest.Cost,
                Condition = string.IsNullOrEmpty(specimenRequest.Condition)
                    ? InventoryCondition.Raw
                    : Enum.Parse<InventoryCondition>(specimenRequest.Condition, true),
                QualityRating = specimenRequest.QualityRating,
                SizeCategories = specimenRequest.SizeCategories != null && specimenRequest.SizeCategories.Length > 0
                    ? string.Join(",", specimenRequest.SizeCategories)
                    : null,
                Notes = specimenRequest.Notes,
                Status = string.IsNullOrEmpty(specimenRequest.Status) ? InventoryStatus.Available : Enum.Parse<InventoryStatus>(specimenRequest.Status, true),
                StorageLocation = specimenRequest.StorageLocation,
                Url = specimenRequest.Url
            };
            InventorySpecimens.Add(inventorySpecimen);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Reload inventory with new specimens to recalculate aggregates
        inventory = await Inventories
            .Include(i => i.InventorySpecimens)
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId, cancellationToken);

        if (inventory != null)
        {
            RecalculateAggregatesFromSpecimens(inventory);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await GetInventoryAsync(inventoryId, userId, cancellationToken);
    }

    public async Task<InventoryStatsDto> GetInventoryStatsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var inventories = await Inventories
            .Where(i => i.UserId == userId)
            .ToListAsync(cancellationToken);

        return new InventoryStatsDto(
            TotalItems: inventories.Count,
            TotalWeightGrams: inventories.Sum(i => i.TotalWeightGrams ?? 0),
            TotalInvested: inventories.Sum(i => i.Cost ?? 0),
            AvailableCount: inventories.Count(i => i.Status == InventoryStatus.Available),
            InUseCount: inventories.Count(i => i.Status == InventoryStatus.InUse),
            DepletedCount: inventories.Count(i => i.Status == InventoryStatus.Depleted)
        );
    }

    private static InventoryListDto MapToInventoryListDto(Inventory inventory)
    {
        var coverPhoto = inventory.InventoryPhotos
            .Where(p => p.IsCover)
            .FirstOrDefault() ?? inventory.InventoryPhotos.FirstOrDefault();

        // Calculate specimen status counts
        var specimens = inventory.InventorySpecimens.ToList();
        var availableCount = specimens.Count(s => s.Status == InventoryStatus.Available);
        var inUseCount = specimens.Count(s => s.Status == InventoryStatus.InUse);
        var depletedCount = specimens.Count(s => s.Status == InventoryStatus.Depleted);

        return new InventoryListDto(
            inventory.InventoryId,
            inventory.Name,
            inventory.AcquiredDate,
            inventory.InventorySourceId,
            inventory.InventorySource?.SourceType.ToString() ?? inventory.SourceType.ToString(),
            inventory.InventorySource?.Name ?? inventory.SourceName,
            inventory.TotalWeightGrams,
            inventory.RemainingWeightGrams,
            inventory.DisplayUnit,
            inventory.Cost,
            inventory.QualityRating,
            inventory.DateCreated,
            inventory.InventorySpecimens.Count,
            inventory.InventoryPhotos.Count,
            coverPhoto?.Url,
            coverPhoto?.ThumbnailUrl,
            availableCount,
            inUseCount,
            depletedCount,
            // Legacy fields
            inventory.Status.ToString(),
            inventory.IsFavorite
        );
    }

    private static InventoryDto MapToInventoryDto(Inventory inventory)
    {
        var specimens = inventory.InventorySpecimens.Select(s =>
        {
            var specimen = s.Specimen;
            var userSpecimen = s.UserSpecimen;

            return new InventorySpecimenDto(
                s.InventorySpecimenId,
                s.SpecimenId,
                s.UserSpecimenId,
                specimen?.CommonName ?? userSpecimen?.CommonName ?? "Unknown",
                specimen?.ScientificName ?? userSpecimen?.ScientificName,
                (specimen?.MaterialType ?? userSpecimen?.MaterialType ?? SpecimenMaterialType.Rock).ToString(),
                (specimen?.TumblingDifficulty ?? userSpecimen?.TumblingDifficulty)?.ToString(),
                s.WeightGrams,
                s.Cost,
                s.Condition?.ToString(),
                s.QualityRating,
                string.IsNullOrEmpty(s.SizeCategories)
                    ? null
                    : s.SizeCategories.Split(',', StringSplitOptions.RemoveEmptyEntries),
                s.Notes,
                s.Status.ToString(),
                s.StorageLocation,
                s.Url,
                specimen != null ? "system" : "user"
            );
        }).ToList();

        var photos = inventory.InventoryPhotos.Select(p => {
            // Find specimen name if linked
            string? specimenName = null;
            if (p.InventorySpecimenId.HasValue)
            {
                var linkedSpecimen = inventory.InventorySpecimens
                    .FirstOrDefault(s => s.InventorySpecimenId == p.InventorySpecimenId);
                if (linkedSpecimen != null)
                {
                    specimenName = linkedSpecimen.Specimen?.CommonName
                        ?? linkedSpecimen.UserSpecimen?.CommonName;
                }
            }
            return new InventoryPhotoDto(
                p.InventoryPhotoId,
                p.Url,
                p.FileName,
                p.Caption,
                p.IsCover,
                p.SortOrder,
                p.DateCreated,
                p.ThumbnailUrl,
                p.MediumUrl,
                p.LargeUrl,
                p.BlurHash,
                p.Width,
                p.Height,
                p.ProcessingStatus.ToString(),
                p.ProcessingError,
                p.InventorySpecimenId,
                specimenName
            );
        }).ToList();

        // Map InventorySource if present
        InventorySourceSummaryDto? inventorySourceDto = null;
        if (inventory.InventorySource != null)
        {
            inventorySourceDto = new InventorySourceSummaryDto(
                inventory.InventorySource.InventorySourceId,
                inventory.InventorySource.SourceType.ToString(),
                inventory.InventorySource.Name,
                inventory.InventorySource.Location,
                inventory.InventorySource.Phone,
                inventory.InventorySource.Url,
                inventory.InventorySource.ContactName
            );
        }

        return new InventoryDto(
            inventory.InventoryId,
            inventory.Name,
            inventory.AcquiredDate,
            inventory.InventorySourceId,
            inventorySourceDto,
            inventory.TotalWeightGrams,
            inventory.RemainingWeightGrams,
            inventory.DisplayUnit,
            inventory.Cost,
            string.IsNullOrEmpty(inventory.SizeCategories)
                ? null
                : inventory.SizeCategories.Split(',', StringSplitOptions.RemoveEmptyEntries),
            inventory.QualityRating,
            inventory.StorageLocation,
            inventory.Notes,
            inventory.DateCreated,
            inventory.DateUpdated,
            specimens,
            photos,
            // Computed fields - weight conversion would be done in frontend
            inventory.TotalWeightGrams,
            inventory.RemainingWeightGrams,
            inventory.InventoryPhotos.Count,
            // Legacy fields for backwards compatibility
            inventory.InventorySource?.SourceType.ToString() ?? inventory.SourceType.ToString(),
            inventory.InventorySource?.Name ?? inventory.SourceName,
            inventory.InventorySource?.Location ?? inventory.SourceLocation,
            inventory.InventorySource?.Url ?? inventory.SourceUrl,
            inventory.Status.ToString(),
            inventory.IsFavorite
        );
    }

    /// <summary>
    /// Recalculates aggregated values from individual specimens.
    /// - TotalWeightGrams: Sum of all specimen weights
    /// - RemainingWeightGrams: Same as total (or preserved if already set and different)
    /// - Cost: Sum of all specimen costs
    /// - QualityRating: Average of all specimen quality ratings (rounded)
    /// - SizeCategories: Union of all specimen size categories
    /// </summary>
    private static void RecalculateAggregatesFromSpecimens(Inventory inventory)
    {
        var specimens = inventory.InventorySpecimens.ToList();

        if (specimens.Count == 0)
        {
            inventory.TotalWeightGrams = null;
            inventory.RemainingWeightGrams = null;
            inventory.Cost = null;
            inventory.QualityRating = null;
            inventory.SizeCategories = null;
            return;
        }

        // Sum of weights
        var specimensWithWeight = specimens.Where(s => s.WeightGrams.HasValue).ToList();
        if (specimensWithWeight.Count > 0)
        {
            var oldTotalWeight = inventory.TotalWeightGrams;
            var totalWeight = specimensWithWeight.Sum(s => s.WeightGrams!.Value);
            inventory.TotalWeightGrams = totalWeight;

            // If remaining weight isn't set or equals the old total, update it too
            if (!inventory.RemainingWeightGrams.HasValue || inventory.RemainingWeightGrams == oldTotalWeight)
            {
                inventory.RemainingWeightGrams = totalWeight;
            }
        }

        // Sum of costs
        var specimensWithCost = specimens.Where(s => s.Cost.HasValue).ToList();
        inventory.Cost = specimensWithCost.Count > 0
            ? specimensWithCost.Sum(s => s.Cost!.Value)
            : null;

        // Average of quality ratings (rounded)
        var specimensWithQuality = specimens.Where(s => s.QualityRating.HasValue).ToList();
        inventory.QualityRating = specimensWithQuality.Count > 0
            ? (int)Math.Round(specimensWithQuality.Average(s => s.QualityRating!.Value))
            : null;

        // Union of size categories
        var allSizeCategories = specimens
            .Where(s => !string.IsNullOrEmpty(s.SizeCategories))
            .SelectMany(s => s.SizeCategories!.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Distinct()
            .OrderBy(c => c)
            .ToList();

        inventory.SizeCategories = allSizeCategories.Count > 0
            ? string.Join(",", allSizeCategories)
            : null;
    }
}
