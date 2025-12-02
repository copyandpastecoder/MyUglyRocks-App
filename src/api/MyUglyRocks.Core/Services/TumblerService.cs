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

        return tumblers.Adapt<IEnumerable<TumblerListDto>>();
    }

    public async Task<TumblerDto?> GetTumblerAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var tumbler = await Tumblers
            .Include(t => t.Barrels.Where(b => b.IsActive))
                .ThenInclude(b => b.StageRunBarrels)
                    .ThenInclude(srb => srb.StageRun)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, cancellationToken);

        return tumbler?.Adapt<TumblerDto>();
    }

    public async Task<TumblerDto> CreateTumblerAsync(Guid userId, CreateTumblerRequest request, CancellationToken cancellationToken = default)
    {
        var tumbler = request.Adapt<Tumbler>();
        tumbler.Id = Guid.NewGuid();
        tumbler.UserId = userId;
        tumbler.DateCreated = DateTime.UtcNow;
        tumbler.DateUpdated = DateTime.UtcNow;

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
                barrel.Id = Guid.NewGuid();
                barrel.TumblerId = tumbler.Id;
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
                Id = Guid.NewGuid(),
                TumblerId = tumbler.Id,
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

        return tumbler.Adapt<TumblerDto>();
    }

    public async Task<TumblerDto?> UpdateTumblerAsync(Guid id, Guid userId, UpdateTumblerRequest request, CancellationToken cancellationToken = default)
    {
        var tumbler = await Tumblers
            .Include(t => t.Barrels)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, cancellationToken);

        if (tumbler == null)
            return null;

        tumbler.Brand = request.Brand;
        tumbler.Model = request.Model;
        tumbler.TumblerType = Enum.Parse<TumblerType>(request.TumblerType, true);
        tumbler.Notes = request.Notes;
        tumbler.IsActive = request.IsActive;
        tumbler.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return tumbler.Adapt<TumblerDto>();
    }

    public async Task<bool> DeleteTumblerAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var tumbler = await Tumblers
            .Include(t => t.Barrels)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, cancellationToken);

        if (tumbler == null)
            return false;

        // Check if any barrels have stage runs via the join table
        var barrelIds = tumbler.Barrels.Select(b => b.Id).ToList();
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
            .FirstOrDefaultAsync(t => t.Id == tumblerId && t.UserId == userId, cancellationToken);

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
        barrel.Id = Guid.NewGuid();
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
            .FirstOrDefaultAsync(b => b.Id == barrelId && b.Tumbler.UserId == userId, cancellationToken);

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
            .FirstOrDefaultAsync(b => b.Id == barrelId && b.Tumbler.UserId == userId, cancellationToken);

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
