using Mapster;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class TumblerService : ITumblerService
{
    private readonly DbContext _context;

    public TumblerService(DbContext context)
    {
        _context = context;
    }

    private DbSet<Tumbler> Tumblers => _context.Set<Tumbler>();
    private DbSet<Barrel> Barrels => _context.Set<Barrel>();
    private DbSet<TumblerModel> TumblerModels => _context.Set<TumblerModel>();
    private DbSet<BarrelNickname> BarrelNicknames => _context.Set<BarrelNickname>();
    private DbSet<StageRunBarrel> StageRunBarrels => _context.Set<StageRunBarrel>();

    public async Task<IEnumerable<TumblerListDto>> GetUserTumblersAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tumblers = await Tumblers
            .Include(t => t.Barrels)
            .Where(t => t.UserId == userId && t.IsActive)
            .OrderByDescending(t => t.DateCreated)
            .ToListAsync(cancellationToken);

        // Calculate duplicate counts for each brand/model combination
        var duplicateCounts = tumblers
            .GroupBy(t => (Brand: t.Brand.ToLower(), Model: (t.Model ?? "").ToLower()))
            .ToDictionary(g => g.Key, g => g.Count());

        return tumblers.Select(t => new TumblerListDto(
            t.TumblerId,
            t.Brand,
            t.Model,
            t.TumblerType.ToString(),
            t.TumblerNumber,
            duplicateCounts[(t.Brand.ToLower(), (t.Model ?? "").ToLower())] > 1,
            t.IsActive,
            t.Barrels.Count(b => b.IsActive),
            t.DateCreated
        ));
    }

    public async Task<TumblerDto?> GetTumblerAsync(Guid tumblerId, Guid userId, CancellationToken cancellationToken = default)
    {
        var tumbler = await Tumblers
            .Include(t => t.Barrels.Where(b => b.IsActive))
                .ThenInclude(b => b.StageRunBarrels)
                    .ThenInclude(srb => srb.StageRun)
                        .ThenInclude(sr => sr!.Cycle)
            .FirstOrDefaultAsync(t => t.TumblerId == tumblerId && t.UserId == userId, cancellationToken);

        if (tumbler == null) return null;

        // Check if there are other tumblers with the same brand/model
        var hasDuplicate = await Tumblers.AnyAsync(t =>
            t.UserId == userId &&
            t.IsActive &&
            t.TumblerId != tumblerId &&
            t.Brand.ToLower() == tumbler.Brand.ToLower() &&
            (t.Model ?? "").ToLower() == (tumbler.Model ?? "").ToLower(),
            cancellationToken);

        var dto = tumbler.Adapt<TumblerDto>();
        return dto with { HasDuplicateBrandModel = hasDuplicate };
    }

    public async Task<TumblerDto> CreateTumblerAsync(Guid userId, CreateTumblerRequest request, CancellationToken cancellationToken = default)
    {
        var tumbler = request.Adapt<Tumbler>();
        tumbler.TumblerId = Guid.NewGuid();
        tumbler.UserId = userId;
        tumbler.DateCreated = DateTime.UtcNow;
        tumbler.DateUpdated = DateTime.UtcNow;

        // Auto-assign tumbler number for this brand/model combination.
        // Note: Only active tumblers are considered for numbering because:
        // 1. Only active tumblers are displayed to users
        // 2. Inactive tumblers may have stale numbers from before deactivation
        // 3. If reactivated, tumbler numbers can be manually adjusted if needed
        var existingMaxNumber = await Tumblers
            .Where(t => t.UserId == userId
                && t.Brand.ToLower() == request.Brand.ToLower()
                && (t.Model ?? "").ToLower() == (request.Model ?? "").ToLower()
                && t.IsActive)
            .Select(t => (int?)t.TumblerNumber)
            .MaxAsync(cancellationToken) ?? 0;

        tumbler.TumblerNumber = existingMaxNumber + 1;

        // Create barrels if provided
        if (request.Barrels?.Any() == true)
        {
            var usedNicknames = new List<string>();
            foreach (var barrelRequest in request.Barrels)
            {
                // Validate barrel capacity doesn't exceed motor capacity
                if (barrelRequest.CapacityLbs.HasValue && request.MotorCapacityLbs.HasValue
                    && barrelRequest.CapacityLbs.Value > request.MotorCapacityLbs.Value)
                {
                    throw new ArgumentException($"Barrel capacity ({barrelRequest.CapacityLbs.Value} lbs) cannot exceed motor capacity ({request.MotorCapacityLbs.Value} lbs)");
                }

                var barrel = barrelRequest.Adapt<Barrel>();
                barrel.BarrelId = Guid.NewGuid();
                barrel.TumblerId = tumbler.TumblerId;
                barrel.Nickname ??= await GetRandomNicknameAsync(usedNicknames, cancellationToken);
                if (barrel.Nickname != null) usedNicknames.Add(barrel.Nickname);
                barrel.DateCreated = DateTime.UtcNow;
                barrel.DateUpdated = DateTime.UtcNow;
                tumbler.Barrels.Add(barrel);
            }
        }
        else
        {
            // Create a default barrel
            var nickname = await GetRandomNicknameAsync([], cancellationToken);
            var defaultBarrel = new Barrel
            {
                BarrelId = Guid.NewGuid(),
                TumblerId = tumbler.TumblerId,
                BarrelNumber = 1,
                Nickname = nickname,
                IsActive = true,
                DateCreated = DateTime.UtcNow,
                DateUpdated = DateTime.UtcNow
            };
            tumbler.Barrels.Add(defaultBarrel);
        }

        await Tumblers.AddAsync(tumbler, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // HasDuplicateBrandModel is true if this is not the first tumbler of this brand/model
        var dto = tumbler.Adapt<TumblerDto>();
        return dto with { HasDuplicateBrandModel = tumbler.TumblerNumber > 1 };
    }

    public async Task<TumblerDto?> UpdateTumblerAsync(Guid tumblerId, Guid userId, UpdateTumblerRequest request, CancellationToken cancellationToken = default)
    {
        var tumbler = await Tumblers
            .Include(t => t.Barrels)
            .FirstOrDefaultAsync(t => t.TumblerId == tumblerId && t.UserId == userId, cancellationToken);

        if (tumbler == null)
            return null;

        // Check if brand/model is changing - if so, recalculate tumbler number
        var brandModelChanged = !string.Equals(tumbler.Brand, request.Brand, StringComparison.OrdinalIgnoreCase)
            || !string.Equals(tumbler.Model ?? "", request.Model ?? "", StringComparison.OrdinalIgnoreCase);

        if (brandModelChanged)
        {
            // Assign next available number in the new brand/model group
            // (only considers active tumblers - see CreateTumblerAsync for rationale)
            var existingMaxNumber = await Tumblers
                .Where(t => t.UserId == userId
                    && t.TumblerId != tumblerId
                    && t.Brand.ToLower() == request.Brand.ToLower()
                    && (t.Model ?? "").ToLower() == (request.Model ?? "").ToLower()
                    && t.IsActive)
                .Select(t => (int?)t.TumblerNumber)
                .MaxAsync(cancellationToken) ?? 0;

            tumbler.TumblerNumber = existingMaxNumber + 1;
        }

        tumbler.Brand = request.Brand;
        tumbler.Model = request.Model;
        tumbler.TumblerType = Enum.Parse<TumblerType>(request.TumblerType, true);
        tumbler.MotorCapacityLbs = request.MotorCapacityLbs;
        tumbler.Notes = request.Notes;
        tumbler.IsActive = request.IsActive;
        tumbler.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Check if there are other tumblers with the same brand/model
        var hasDuplicate = await Tumblers.AnyAsync(t =>
            t.UserId == userId &&
            t.IsActive &&
            t.TumblerId != tumblerId &&
            t.Brand.ToLower() == tumbler.Brand.ToLower() &&
            (t.Model ?? "").ToLower() == (tumbler.Model ?? "").ToLower(),
            cancellationToken);

        var dto = tumbler.Adapt<TumblerDto>();
        return dto with { HasDuplicateBrandModel = hasDuplicate };
    }

    public async Task<bool> DeleteTumblerAsync(Guid tumblerId, Guid userId, CancellationToken cancellationToken = default)
    {
        var tumbler = await Tumblers
            .Include(t => t.Barrels)
            .FirstOrDefaultAsync(t => t.TumblerId == tumblerId && t.UserId == userId, cancellationToken);

        if (tumbler == null)
            return false;

        // Check if any barrels have stage runs via the join table
        var barrelIds = tumbler.Barrels.Select(b => b.BarrelId).ToList();
        var hasStageRuns = await StageRunBarrels.AnyAsync(srb => barrelIds.Contains(srb.BarrelId), cancellationToken);

        if (hasStageRuns)
        {
            // Soft delete - just set IsActive to false
            tumbler.IsActive = false;
            tumbler.DateUpdated = DateTime.UtcNow;
            foreach (var barrel in tumbler.Barrels)
            {
                barrel.IsActive = false;
                barrel.DateUpdated = DateTime.UtcNow;
            }
        }
        else
        {
            // Hard delete
            _context.RemoveRange(tumbler.Barrels);
            Tumblers.Remove(tumbler);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<BarrelDto?> AddBarrelAsync(Guid tumblerId, Guid userId, CreateBarrelRequest request, CancellationToken cancellationToken = default)
    {
        var tumbler = await Tumblers
            .Include(t => t.Barrels)
            .Include(t => t.TumblerModel)
            .FirstOrDefaultAsync(t => t.TumblerId == tumblerId && t.UserId == userId, cancellationToken);

        if (tumbler == null)
            return null;

        // Validate barrel capacity doesn't exceed motor capacity
        var motorCapacity = tumbler.MotorCapacityLbs ?? tumbler.TumblerModel?.MotorCapacityLbs;
        if (request.CapacityLbs.HasValue && motorCapacity.HasValue && request.CapacityLbs.Value > motorCapacity.Value)
        {
            throw new ArgumentException($"Barrel capacity ({request.CapacityLbs.Value} lbs) cannot exceed motor capacity ({motorCapacity.Value} lbs)");
        }

        var usedNicknames = tumbler.Barrels.Where(b => b.Nickname != null).Select(b => b.Nickname!).ToList();

        var barrel = request.Adapt<Barrel>();
        barrel.BarrelId = Guid.NewGuid();
        barrel.TumblerId = tumblerId;
        barrel.Nickname ??= await GetRandomNicknameAsync(usedNicknames, cancellationToken);
        barrel.DateCreated = DateTime.UtcNow;
        barrel.DateUpdated = DateTime.UtcNow;

        await Barrels.AddAsync(barrel, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return barrel.Adapt<BarrelDto>();
    }

    public async Task<BarrelDto?> UpdateBarrelAsync(Guid barrelId, Guid userId, UpdateBarrelRequest request, CancellationToken cancellationToken = default)
    {
        var barrel = await Barrels
            .Include(b => b.Tumbler)
                .ThenInclude(t => t.TumblerModel)
            .FirstOrDefaultAsync(b => b.BarrelId == barrelId && b.Tumbler.UserId == userId, cancellationToken);

        if (barrel == null)
            return null;

        // Validate barrel capacity doesn't exceed motor capacity
        var motorCapacity = barrel.Tumbler.MotorCapacityLbs ?? barrel.Tumbler.TumblerModel?.MotorCapacityLbs;
        if (request.CapacityLbs.HasValue && motorCapacity.HasValue && request.CapacityLbs.Value > motorCapacity.Value)
        {
            throw new ArgumentException($"Barrel capacity ({request.CapacityLbs.Value} lbs) cannot exceed motor capacity ({motorCapacity.Value} lbs)");
        }

        barrel.Nickname = request.Nickname;
        barrel.CapacityLbs = request.CapacityLbs;
        barrel.DefaultGritAmountGrams = request.DefaultGritAmountGrams;
        barrel.IsDedicated = request.IsDedicated;
        barrel.DedicatedStages = request.DedicatedStages;
        barrel.IsActive = request.IsActive;
        barrel.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return barrel.Adapt<BarrelDto>();
    }

    public async Task<bool> DeleteBarrelAsync(Guid barrelId, Guid userId, CancellationToken cancellationToken = default)
    {
        var barrel = await Barrels
            .Include(b => b.Tumbler)
            .FirstOrDefaultAsync(b => b.BarrelId == barrelId && b.Tumbler.UserId == userId, cancellationToken);

        if (barrel == null)
            return false;

        // Check if barrel has stage runs via the join table
        var hasStageRuns = await StageRunBarrels.AnyAsync(srb => srb.BarrelId == barrelId, cancellationToken);

        if (hasStageRuns)
        {
            // Soft delete
            barrel.IsActive = false;
            barrel.DateUpdated = DateTime.UtcNow;
        }
        else
        {
            // Hard delete
            Barrels.Remove(barrel);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<TumblerModelDto>> GetTumblerModelsAsync(CancellationToken cancellationToken = default)
    {
        var models = await TumblerModels
            .Where(tm => tm.IsActive)
            .OrderBy(tm => tm.SortOrder)
            .ThenBy(tm => tm.Brand)
            .ThenBy(tm => tm.Model)
            .ToListAsync(cancellationToken);

        return models.Adapt<IEnumerable<TumblerModelDto>>();
    }

    private async Task<string?> GetRandomNicknameAsync(List<string> usedNicknames, CancellationToken cancellationToken)
    {
        var nickname = await BarrelNicknames
            .Where(n => n.IsActive && !usedNicknames.Contains(n.Name))
            .OrderBy(n => Guid.NewGuid())
            .Select(n => n.Name)
            .FirstOrDefaultAsync(cancellationToken);

        return nickname ?? $"Barrel {usedNicknames.Count + 1}";
    }
}
