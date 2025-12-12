using Mapster;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class CycleService : ICycleService
{
    private readonly DbContext _context;
    private readonly INotificationService _notificationService;

    public CycleService(DbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    private DbSet<Cycle> Cycles => _context.Set<Cycle>();
    private DbSet<StageRun> StageRuns => _context.Set<StageRun>();
    private DbSet<CleaningRun> CleaningRuns => _context.Set<CleaningRun>();
    private DbSet<StageMaterial> StageMaterials => _context.Set<StageMaterial>();
    private DbSet<CleaningMaterial> CleaningMaterials => _context.Set<CleaningMaterial>();
    private DbSet<CycleSpecimen> CycleSpecimens => _context.Set<CycleSpecimen>();

    public async Task<IEnumerable<CycleListDto>> GetUserCyclesAsync(Guid userId, string? status = null, CancellationToken cancellationToken = default)
    {
        var query = Cycles
            .Include(c => c.StageRuns)
            .Where(c => c.UserId == userId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CycleStatus>(status, true, out var cycleStatus))
        {
            query = query.Where(c => c.Status == cycleStatus);
        }

        var cycles = await query
            .OrderByDescending(c => c.DateCreated)
            .ToListAsync(cancellationToken);

        return cycles.Adapt<IEnumerable<CycleListDto>>();
    }

    public async Task<CycleDto?> GetCycleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles
            .Include(c => c.StageRuns.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.StageRunBarrels)
                    .ThenInclude(srb => srb.Barrel)
            .Include(c => c.StageRuns.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.StageMaterials)
                    .ThenInclude(sm => sm.Material)
            .Include(c => c.StageRuns.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.CleaningRun)
                    .ThenInclude(cr => cr!.CleaningMaterials)
                        .ThenInclude(cm => cm.Material)
            .Include(c => c.StageRuns.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.Photos.Where(p => !p.IsDeleted))
            .Include(c => c.CycleSpecimens)
                .ThenInclude(cs => cs.Specimen)
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId && !c.IsDeleted, cancellationToken);

        return cycle?.Adapt<CycleDto>();
    }

    public async Task<CycleDto> CreateCycleAsync(Guid userId, CreateCycleRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = request.Adapt<Cycle>();
        cycle.Id = Guid.NewGuid();
        cycle.UserId = userId;
        cycle.Status = CycleStatus.Active;
        cycle.DateCreated = DateTime.UtcNow;
        cycle.DateUpdated = DateTime.UtcNow;

        // Add specimens if provided
        if (request.SpecimenIds?.Any() == true)
        {
            foreach (var specimenId in request.SpecimenIds)
            {
                cycle.CycleSpecimens.Add(new CycleSpecimen
                {
                    CycleId = cycle.Id,
                    SpecimenId = specimenId,
                    DateCreated = DateTime.UtcNow,
                    DateUpdated = DateTime.UtcNow
                });
            }
        }

        await Cycles.AddAsync(cycle, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetCycleAsync(cycle.Id, userId, cancellationToken) ?? cycle.Adapt<CycleDto>();
    }

    public async Task<CycleDto?> UpdateCycleAsync(Guid id, Guid userId, UpdateCycleRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return null;

        cycle.Name = request.Name;
        cycle.StartDate = request.StartDate;
        cycle.Goal = request.Goal;
        cycle.DifficultyRating = request.DifficultyRating;
        cycle.AdditionalSpecimens = request.AdditionalSpecimens;
        cycle.Notes = request.Notes;
        cycle.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCycleAsync(id, userId, cancellationToken);
    }

    public async Task<bool> DeleteCycleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return false;

        // Soft delete
        cycle.IsDeleted = true;
        cycle.DateDeleted = DateTime.UtcNow;
        cycle.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CycleDto?> CompleteCycleAsync(Guid id, Guid userId, CompleteCycleRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return null;

        cycle.Status = CycleStatus.Completed;
        cycle.EndDate = DateOnly.FromDateTime(DateTime.UtcNow);
        cycle.FinalQuality = request.FinalQuality;
        if (!string.IsNullOrEmpty(request.Notes))
            cycle.Notes = string.IsNullOrEmpty(cycle.Notes) ? request.Notes : $"{cycle.Notes}\n\n{request.Notes}";
        cycle.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCycleAsync(id, userId, cancellationToken);
    }

    public async Task<CycleDto?> ArchiveCycleAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return null;

        cycle.Status = CycleStatus.Archived;
        cycle.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCycleAsync(id, userId, cancellationToken);
    }

    // Stage Run operations
    public async Task<StageRunDto?> GetStageRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.StageRunBarrels)
                .ThenInclude(srb => srb.Barrel)
            .Include(s => s.StageMaterials)
                .ThenInclude(sm => sm.Material)
            .Include(s => s.CleaningRun)
                .ThenInclude(cr => cr!.CleaningMaterials)
                    .ThenInclude(cm => cm.Material)
            .Include(s => s.Photos.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(s => s.Id == id && s.Cycle.UserId == userId, cancellationToken);

        return stageRun?.Adapt<StageRunDto>();
    }

    public async Task<StageRunDto?> AddStageRunAsync(Guid cycleId, Guid userId, CreateStageRunRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.Id == cycleId && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return null;

        var stageRun = request.Adapt<StageRun>();
        stageRun.Id = Guid.NewGuid();
        stageRun.CycleId = cycleId;
        stageRun.EndDateTime = stageRun.StartDateTime
            .AddDays(request.DurationDays)
            .AddHours(request.DurationHours);
        stageRun.Status = StageRunStatus.Active;
        stageRun.DateCreated = DateTime.UtcNow;
        stageRun.DateUpdated = DateTime.UtcNow;

        // Calculate RunNumber: count existing non-deleted stages with the same name + 1
        var existingRunCount = await StageRuns
            .CountAsync(s => s.CycleId == cycleId && s.StageName == request.StageName && !s.IsDeleted, cancellationToken);
        stageRun.RunNumber = existingRunCount + 1;

        // Add barrels
        if (request.BarrelIds?.Any() == true)
        {
            foreach (var barrelId in request.BarrelIds)
            {
                stageRun.StageRunBarrels.Add(new StageRunBarrel
                {
                    StageRunId = stageRun.Id,
                    BarrelId = barrelId
                });
            }
        }

        // Add materials if provided
        if (request.Materials?.Any() == true)
        {
            int sortOrder = 0;
            foreach (var materialRequest in request.Materials)
            {
                var material = new StageMaterial
                {
                    Id = Guid.NewGuid(),
                    StageRunId = stageRun.Id,
                    MaterialId = materialRequest.MaterialId,
                    DisplayAmount = materialRequest.DisplayAmount,
                    DisplayUnit = materialRequest.DisplayUnit,
                    SortOrder = sortOrder++,
                    DateCreated = DateTime.UtcNow,
                    DateUpdated = DateTime.UtcNow
                };
                stageRun.StageMaterials.Add(material);
            }
        }

        await StageRuns.AddAsync(stageRun, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Schedule stage reminder if enabled
        if (stageRun.ReminderEnabled)
        {
            DateTime reminderTime;
            if (stageRun.RemindAtEndOfStage == true)
            {
                reminderTime = stageRun.EndDateTime;
            }
            else if (stageRun.RemindAfterDays.HasValue)
            {
                reminderTime = stageRun.StartDateTime.AddDays(stageRun.RemindAfterDays.Value);
            }
            else
            {
                // Default: remind at end of stage
                reminderTime = stageRun.EndDateTime;
            }

            await _notificationService.ScheduleStageReminderAsync(stageRun.Id, reminderTime, cancellationToken);
        }

        return await GetStageRunAsync(stageRun.Id, userId, cancellationToken);
    }

    public async Task<StageRunDto?> UpdateStageRunAsync(Guid id, Guid userId, UpdateStageRunRequest request, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.StageRunBarrels)
            .FirstOrDefaultAsync(s => s.Id == id && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null)
            return null;

        stageRun.StageName = request.StageName;
        stageRun.StartDateTime = request.StartDateTime;
        stageRun.DurationDays = request.DurationDays;
        stageRun.DurationHours = request.DurationHours;
        stageRun.EndDateTime = request.StartDateTime
            .AddDays(request.DurationDays)
            .AddHours(request.DurationHours);
        stageRun.ReminderEnabled = request.ReminderEnabled;
        stageRun.RemindAfterDays = request.RemindAfterDays;
        stageRun.RemindAtEndOfStage = request.RemindAtEndOfStage;
        stageRun.LoadWeightBeforeGrams = request.LoadWeightBeforeGrams;
        stageRun.LoadWeightAfterGrams = request.LoadWeightAfterGrams;
        stageRun.FillLevelPercent = request.FillLevelPercent;
        stageRun.WaterLevel = !string.IsNullOrEmpty(request.WaterLevel)
            ? Enum.Parse<WaterLevel>(request.WaterLevel, true)
            : null;
        stageRun.WaterAmountMl = request.WaterAmountMl;
        stageRun.Notes = request.Notes;
        stageRun.DateUpdated = DateTime.UtcNow;

        // Update barrels if provided
        if (request.BarrelIds != null)
        {
            // Remove existing barrel associations
            stageRun.StageRunBarrels.Clear();

            // Add new barrel associations
            foreach (var barrelId in request.BarrelIds)
            {
                stageRun.StageRunBarrels.Add(new StageRunBarrel
                {
                    StageRunId = stageRun.Id,
                    BarrelId = barrelId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStageRunAsync(id, userId, cancellationToken);
    }

    public async Task<bool> DeleteStageRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .FirstOrDefaultAsync(s => s.Id == id && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null)
            return false;

        // Soft delete
        stageRun.IsDeleted = true;
        stageRun.DateDeleted = DateTime.UtcNow;
        stageRun.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<StageRunDto?> CompleteStageRunAsync(Guid id, Guid userId, CompleteStageRunRequest request, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .FirstOrDefaultAsync(s => s.Id == id && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null)
            return null;

        stageRun.Status = StageRunStatus.Completed;
        stageRun.ResultRating = request.ResultRating;
        stageRun.ResultShapeRounding = request.ResultShapeRounding;
        stageRun.ResultScratchLevel = request.ResultScratchLevel;
        stageRun.ResultPitting = request.ResultPitting;
        stageRun.ResultShine = request.ResultShine;
        stageRun.IssueScratches = request.IssueScratches;
        stageRun.IssueChips = request.IssueChips;
        stageRun.IssueUnderRounded = request.IssueUnderRounded;
        stageRun.IssueContamination = request.IssueContamination;
        stageRun.LessonsLearned = request.LessonsLearned;
        stageRun.NextAction = !string.IsNullOrEmpty(request.NextAction)
            ? Enum.Parse<StageNextAction>(request.NextAction, true)
            : null;
        stageRun.LoadWeightAfterGrams = request.LoadWeightAfterGrams;
        stageRun.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStageRunAsync(id, userId, cancellationToken);
    }

    // Cleaning Run operations
    public async Task<CleaningRunDto?> AddCleaningRunAsync(Guid stageRunId, Guid userId, CreateCleaningRunRequest request, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.CleaningRun)
            .FirstOrDefaultAsync(s => s.Id == stageRunId && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null || stageRun.CleaningRun != null)
            return null;

        var cleaningRun = request.Adapt<CleaningRun>();
        cleaningRun.Id = Guid.NewGuid();
        cleaningRun.StageRunId = stageRunId;
        cleaningRun.Status = CleaningRunStatus.Active;
        cleaningRun.DateCreated = DateTime.UtcNow;
        cleaningRun.DateUpdated = DateTime.UtcNow;

        // Add materials if provided
        if (request.Materials?.Any() == true)
        {
            int sortOrder = 0;
            foreach (var materialRequest in request.Materials)
            {
                var material = new CleaningMaterial
                {
                    Id = Guid.NewGuid(),
                    CleaningRunId = cleaningRun.Id,
                    MaterialId = materialRequest.MaterialId,
                    DisplayAmount = materialRequest.DisplayAmount,
                    DisplayUnit = materialRequest.DisplayUnit,
                    SortOrder = sortOrder++,
                    DateCreated = DateTime.UtcNow,
                    DateUpdated = DateTime.UtcNow
                };
                cleaningRun.CleaningMaterials.Add(material);
            }
        }

        await CleaningRuns.AddAsync(cleaningRun, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return cleaningRun.Adapt<CleaningRunDto>();
    }

    public async Task<bool> CompleteCleaningRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cleaningRun = await CleaningRuns
            .Include(cr => cr.StageRun)
                .ThenInclude(s => s.Cycle)
            .FirstOrDefaultAsync(cr => cr.Id == id && cr.StageRun.Cycle.UserId == userId, cancellationToken);

        if (cleaningRun == null)
            return false;

        cleaningRun.Status = CleaningRunStatus.Completed;
        cleaningRun.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteCleaningRunAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var cleaningRun = await CleaningRuns
            .Include(cr => cr.StageRun)
                .ThenInclude(s => s.Cycle)
            .FirstOrDefaultAsync(cr => cr.Id == id && cr.StageRun.Cycle.UserId == userId, cancellationToken);

        if (cleaningRun == null)
            return false;

        CleaningRuns.Remove(cleaningRun);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    // Material operations
    public async Task<StageMaterialDto?> AddStageMaterialAsync(Guid stageRunId, Guid userId, CreateStageMaterialRequest request, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.StageMaterials)
            .FirstOrDefaultAsync(s => s.Id == stageRunId && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null)
            return null;

        // Check max 10 materials
        if (stageRun.StageMaterials.Count >= 10)
            return null;

        var material = new StageMaterial
        {
            Id = Guid.NewGuid(),
            StageRunId = stageRunId,
            MaterialId = request.MaterialId,
            DisplayAmount = request.DisplayAmount,
            DisplayUnit = request.DisplayUnit,
            SortOrder = stageRun.StageMaterials.Count,
            DateCreated = DateTime.UtcNow,
            DateUpdated = DateTime.UtcNow
        };

        await StageMaterials.AddAsync(material, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with material navigation property
        var savedMaterial = await StageMaterials
            .Include(sm => sm.Material)
            .FirstAsync(sm => sm.Id == material.Id, cancellationToken);

        return savedMaterial.Adapt<StageMaterialDto>();
    }

    public async Task<bool> RemoveStageMaterialAsync(Guid stageRunId, Guid materialId, Guid userId, CancellationToken cancellationToken = default)
    {
        var stageMaterial = await StageMaterials
            .Include(sm => sm.StageRun)
                .ThenInclude(s => s.Cycle)
            .FirstOrDefaultAsync(sm => sm.StageRunId == stageRunId && sm.MaterialId == materialId && sm.StageRun.Cycle.UserId == userId, cancellationToken);

        if (stageMaterial == null)
            return false;

        StageMaterials.Remove(stageMaterial);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
