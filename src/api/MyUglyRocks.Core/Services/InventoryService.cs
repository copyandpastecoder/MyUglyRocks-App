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
            SourceType = Enum.Parse<SourceType>(request.SourceType, true),
            SourceName = request.SourceName,
            SourceLocation = request.SourceLocation,
            SourceUrl = request.SourceUrl,
            TotalWeightGrams = request.TotalWeightGrams,
            RemainingWeightGrams = request.RemainingWeightGrams ?? request.TotalWeightGrams,
            DisplayUnit = request.DisplayUnit ?? "g",
            Cost = request.Cost,
            Condition = Enum.Parse<InventoryCondition>(request.Condition, true),
            SizeCategory = string.IsNullOrEmpty(request.SizeCategory) ? null : Enum.Parse<SizeCategory>(request.SizeCategory, true),
            QualityRating = request.QualityRating,
            Status = string.IsNullOrEmpty(request.Status) ? InventoryStatus.Available : Enum.Parse<InventoryStatus>(request.Status, true),
            StorageLocation = request.StorageLocation,
            Notes = request.Notes,
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
                    EstimatedPercentage = specimenRequest.EstimatedPercentage,
                    Notes = specimenRequest.Notes
                };
                InventorySpecimens.Add(inventorySpecimen);
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        return (await GetInventoryAsync(inventory.InventoryId, userId, cancellationToken))!;
    }

    public async Task<InventoryDto?> UpdateInventoryAsync(Guid inventoryId, Guid userId, UpdateInventoryRequest request, CancellationToken cancellationToken = default)
    {
        var inventory = await Inventories
            .FirstOrDefaultAsync(i => i.InventoryId == inventoryId && i.UserId == userId, cancellationToken);

        if (inventory == null)
            return null;

        inventory.Name = request.Name;
        inventory.AcquiredDate = request.AcquiredDate;
        inventory.SourceType = Enum.Parse<SourceType>(request.SourceType, true);
        inventory.SourceName = request.SourceName;
        inventory.SourceLocation = request.SourceLocation;
        inventory.SourceUrl = request.SourceUrl;
        inventory.TotalWeightGrams = request.TotalWeightGrams;
        inventory.RemainingWeightGrams = request.RemainingWeightGrams;
        inventory.DisplayUnit = request.DisplayUnit ?? "g";
        inventory.Cost = request.Cost;
        inventory.Condition = Enum.Parse<InventoryCondition>(request.Condition, true);
        inventory.SizeCategory = string.IsNullOrEmpty(request.SizeCategory) ? null : Enum.Parse<SizeCategory>(request.SizeCategory, true);
        inventory.QualityRating = request.QualityRating;
        inventory.Status = string.IsNullOrEmpty(request.Status) ? inventory.Status : Enum.Parse<InventoryStatus>(request.Status, true);
        inventory.StorageLocation = request.StorageLocation;
        inventory.Notes = request.Notes;
        inventory.IsFavorite = request.IsFavorite ?? inventory.IsFavorite;

        await _context.SaveChangesAsync(cancellationToken);

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
                EstimatedPercentage = specimenRequest.EstimatedPercentage,
                Notes = specimenRequest.Notes
            };
            InventorySpecimens.Add(inventorySpecimen);
        }

        await _context.SaveChangesAsync(cancellationToken);

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

        return new InventoryListDto(
            inventory.InventoryId,
            inventory.Name,
            inventory.AcquiredDate,
            inventory.SourceType.ToString(),
            inventory.SourceName,
            inventory.TotalWeightGrams,
            inventory.RemainingWeightGrams,
            inventory.DisplayUnit,
            inventory.Cost,
            inventory.Condition.ToString(),
            inventory.Status.ToString(),
            inventory.IsFavorite,
            inventory.DateCreated,
            inventory.InventorySpecimens.Count,
            inventory.InventoryPhotos.Count,
            coverPhoto?.Url,
            coverPhoto?.ThumbnailUrl
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
                s.EstimatedPercentage,
                s.Notes,
                specimen != null ? "system" : "user"
            );
        }).ToList();

        var photos = inventory.InventoryPhotos.Select(p => new InventoryPhotoDto(
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
            p.ProcessingError
        )).ToList();

        return new InventoryDto(
            inventory.InventoryId,
            inventory.Name,
            inventory.AcquiredDate,
            inventory.SourceType.ToString(),
            inventory.SourceName,
            inventory.SourceLocation,
            inventory.SourceUrl,
            inventory.TotalWeightGrams,
            inventory.RemainingWeightGrams,
            inventory.DisplayUnit,
            inventory.Cost,
            inventory.Condition.ToString(),
            inventory.SizeCategory?.ToString(),
            inventory.QualityRating,
            inventory.Status.ToString(),
            inventory.StorageLocation,
            inventory.Notes,
            inventory.IsFavorite,
            inventory.DateCreated,
            inventory.DateUpdated,
            specimens,
            photos,
            // Computed fields - weight conversion would be done in frontend
            inventory.TotalWeightGrams,
            inventory.RemainingWeightGrams,
            inventory.InventoryPhotos.Count
        );
    }
}
