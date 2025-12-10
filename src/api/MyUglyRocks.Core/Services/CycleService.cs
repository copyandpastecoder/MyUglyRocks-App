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

    public async Task<CycleDto?> GetCycleAsync(Guid cycleId, Guid userId, CancellationToken cancellationToken = default)
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
            .FirstOrDefaultAsync(c => c.CycleId == cycleId && c.UserId == userId && !c.IsDeleted, cancellationToken);

        if (cycle == null)
            return null;

        // Check if there's a post for this cycle
        var postId = await _context.Set<Post>()
            .Where(p => p.CycleId == cycleId && !p.IsDeleted)
            .Select(p => (Guid?)p.PostId)
            .FirstOrDefaultAsync(cancellationToken);

        // Calculate run numbers for each stage
        var runNumbers = CalculateRunNumbers(cycle.StageRuns);

        // Map to DTO with run numbers
        return MapCycleToDto(cycle, runNumbers, postId);
    }

    private static (Dictionary<Guid, int> RunNumbers, Dictionary<string, int> TotalRuns) CalculateRunNumbers(IEnumerable<StageRun> stageRuns)
    {
        var runNumbers = new Dictionary<Guid, int>();
        var totalRuns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var activeStages = stageRuns
            .Where(s => !s.IsDeleted)
            .OrderBy(s => s.DateCreated)
            .ToList();

        // Group by stage name (case-insensitive) and assign run numbers
        var stageNameGroups = activeStages
            .GroupBy(s => s.StageName.ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.OrderBy(s => s.DateCreated).ToList());

        foreach (var group in stageNameGroups)
        {
            totalRuns[group.Key] = group.Value.Count;
            for (int i = 0; i < group.Value.Count; i++)
            {
                runNumbers[group.Value[i].StageRunId] = i + 1;
            }
        }

        return (runNumbers, totalRuns);
    }

    private static CycleDto MapCycleToDto(Cycle cycle, (Dictionary<Guid, int> RunNumbers, Dictionary<string, int> TotalRuns) runInfo, Guid? postId = null)
    {
        var stageRunSummaries = cycle.StageRuns
            .Where(s => !s.IsDeleted)
            .OrderBy(s => s.DateCreated)
            .Select(s => new StageRunSummaryDto(
                s.StageRunId,
                s.StageName,
                runInfo.RunNumbers.GetValueOrDefault(s.StageRunId, 1),
                runInfo.TotalRuns.GetValueOrDefault(s.StageName.ToLowerInvariant(), 1),
                s.StartDateTime,
                s.EndDateTime,
                s.Status.ToString(),
                s.ResultRating,
                s.CleaningRun?.Adapt<CleaningRunDto>()
            ));

        var specimens = cycle.CycleSpecimens
            .Select(cs => cs.Specimen.Adapt<SpecimenDto>());

        return new CycleDto(
            cycle.CycleId,
            cycle.Name,
            cycle.StartDate,
            cycle.EndDate,
            cycle.Status.ToString(),
            cycle.Goal,
            cycle.DifficultyRating,
            cycle.FinalQuality,
            cycle.AdditionalSpecimens,
            cycle.Notes,
            cycle.DateCreated,
            stageRunSummaries,
            specimens,
            postId
        );
    }

    public async Task<CycleDto> CreateCycleAsync(Guid userId, CreateCycleRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = request.Adapt<Cycle>();
        cycle.CycleId = Guid.NewGuid();
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
                    CycleId = cycle.CycleId,
                    SpecimenId = specimenId,
                    DateCreated = DateTime.UtcNow,
                    DateUpdated = DateTime.UtcNow
                });
            }
        }

        await Cycles.AddAsync(cycle, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetCycleAsync(cycle.CycleId, userId, cancellationToken) ?? cycle.Adapt<CycleDto>();
    }

    public async Task<CycleDto?> UpdateCycleAsync(Guid cycleId, Guid userId, UpdateCycleRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.CycleId == cycleId && c.UserId == userId, cancellationToken);

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

        return await GetCycleAsync(cycleId, userId, cancellationToken);
    }

    public async Task<bool> DeleteCycleAsync(Guid cycleId, Guid userId, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.CycleId == cycleId && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return false;

        // Soft delete
        cycle.IsDeleted = true;
        cycle.DateDeleted = DateTime.UtcNow;
        cycle.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CycleDto?> CompleteCycleAsync(Guid cycleId, Guid userId, CompleteCycleRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.CycleId == cycleId && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return null;

        cycle.Status = CycleStatus.Completed;
        cycle.EndDate = DateOnly.FromDateTime(DateTime.UtcNow);
        cycle.FinalQuality = request.FinalQuality;
        if (!string.IsNullOrEmpty(request.Notes))
            cycle.Notes = string.IsNullOrEmpty(cycle.Notes) ? request.Notes : $"{cycle.Notes}\n\n{request.Notes}";
        cycle.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCycleAsync(cycleId, userId, cancellationToken);
    }

    public async Task<CycleDto?> ArchiveCycleAsync(Guid cycleId, Guid userId, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.CycleId == cycleId && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return null;

        cycle.Status = CycleStatus.Archived;
        cycle.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCycleAsync(cycleId, userId, cancellationToken);
    }

    // Stage Run operations
    public async Task<StageRunDto?> GetStageRunAsync(Guid stageRunId, Guid userId, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
                .ThenInclude(c => c.StageRuns.Where(sr => !sr.IsDeleted))
            .Include(s => s.StageRunBarrels)
                .ThenInclude(srb => srb.Barrel)
            .Include(s => s.StageMaterials)
                .ThenInclude(sm => sm.Material)
            .Include(s => s.CleaningRun)
                .ThenInclude(cr => cr!.CleaningMaterials)
                    .ThenInclude(cm => cm.Material)
            .Include(s => s.Photos.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null)
            return null;

        // Calculate run number and total runs for this stage
        var runInfo = CalculateRunNumbers(stageRun.Cycle.StageRuns);
        var runNumber = runInfo.RunNumbers.GetValueOrDefault(stageRun.StageRunId, 1);
        var totalRuns = runInfo.TotalRuns.GetValueOrDefault(stageRun.StageName.ToLowerInvariant(), 1);

        return MapStageRunToDto(stageRun, runNumber, totalRuns);
    }

    private static StageRunDto MapStageRunToDto(StageRun stageRun, int runNumber, int totalRuns)
    {
        var barrels = stageRun.StageRunBarrels
            .Where(srb => srb.Barrel != null)
            .Select(srb => srb.Barrel!.Adapt<BarrelDto>());

        var materials = stageRun.StageMaterials
            .Select(sm => sm.Adapt<StageMaterialDto>());

        var photos = stageRun.Photos
            .Where(p => !p.IsDeleted)
            .Select(p => p.Adapt<PhotoDto>());

        var cleaningRun = stageRun.CleaningRun?.Adapt<CleaningRunDto>();

        return new StageRunDto(
            stageRun.StageRunId,
            stageRun.CycleId,
            stageRun.StageName,
            runNumber,
            totalRuns,
            stageRun.StartDateTime,
            stageRun.DurationDays,
            stageRun.DurationHours,
            stageRun.EndDateTime,
            stageRun.Status.ToString(),
            stageRun.ReminderEnabled,
            stageRun.LoadWeightBeforeGrams,
            stageRun.FillLevelPercent,
            stageRun.WaterLevel?.ToString(),
            stageRun.WaterAmountMl,
            stageRun.ResultRating,
            stageRun.NextAction?.ToString(),
            stageRun.Notes,
            stageRun.DateCreated,
            barrels,
            cleaningRun,
            materials,
            photos
        );
    }

    public async Task<StageRunDto?> AddStageRunAsync(Guid cycleId, Guid userId, CreateStageRunRequest request, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles.FirstOrDefaultAsync(c => c.CycleId == cycleId && c.UserId == userId, cancellationToken);

        if (cycle == null)
            return null;

        var stageRun = request.Adapt<StageRun>();
        stageRun.StageRunId = Guid.NewGuid();
        stageRun.CycleId = cycleId;
        stageRun.EndDateTime = stageRun.StartDateTime
            .AddDays(request.DurationDays)
            .AddHours(request.DurationHours);
        stageRun.Status = StageRunStatus.Active;
        stageRun.DateCreated = DateTime.UtcNow;
        stageRun.DateUpdated = DateTime.UtcNow;

        // Add barrels
        if (request.BarrelIds?.Any() == true)
        {
            foreach (var barrelId in request.BarrelIds)
            {
                stageRun.StageRunBarrels.Add(new StageRunBarrel
                {
                    StageRunId = stageRun.StageRunId,
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
                    StageMaterialId = Guid.NewGuid(),
                    StageRunId = stageRun.StageRunId,
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

        // Add cleaning run if provided
        if (request.CleaningRun != null)
        {
            var cleaningRun = new CleaningRun
            {
                CleaningRunId = Guid.NewGuid(),
                StageRunId = stageRun.StageRunId,
                DurationMinutes = request.CleaningRun.DurationMinutes,
                Purpose = !string.IsNullOrEmpty(request.CleaningRun.Purpose)
                    ? Enum.Parse<CleaningPurpose>(request.CleaningRun.Purpose, true)
                    : null,
                ReminderEnabled = request.CleaningRun.ReminderEnabled,
                Notes = request.CleaningRun.Notes,
                Status = CleaningRunStatus.Active,
                DateCreated = DateTime.UtcNow,
                DateUpdated = DateTime.UtcNow
            };

            // Add cleaning materials if provided
            if (request.CleaningRun.Materials?.Any() == true)
            {
                int cleaningSortOrder = 0;
                foreach (var materialRequest in request.CleaningRun.Materials)
                {
                    cleaningRun.CleaningMaterials.Add(new CleaningMaterial
                    {
                        CleaningMaterialId = Guid.NewGuid(),
                        CleaningRunId = cleaningRun.CleaningRunId,
                        MaterialId = materialRequest.MaterialId,
                        DisplayAmount = materialRequest.DisplayAmount,
                        DisplayUnit = materialRequest.DisplayUnit,
                        SortOrder = cleaningSortOrder++,
                        DateCreated = DateTime.UtcNow,
                        DateUpdated = DateTime.UtcNow
                    });
                }
            }

            stageRun.CleaningRun = cleaningRun;
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

            await _notificationService.ScheduleStageReminderAsync(stageRun.StageRunId, reminderTime, cancellationToken);
        }

        return await GetStageRunAsync(stageRun.StageRunId, userId, cancellationToken);
    }

    public async Task<StageRunDto?> UpdateStageRunAsync(Guid stageRunId, Guid userId, UpdateStageRunRequest request, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.StageRunBarrels)
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && s.Cycle.UserId == userId, cancellationToken);

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
                    StageRunId = stageRun.StageRunId,
                    BarrelId = barrelId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStageRunAsync(stageRunId, userId, cancellationToken);
    }

    public async Task<bool> DeleteStageRunAsync(Guid stageRunId, Guid userId, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null)
            return false;

        // Soft delete
        stageRun.IsDeleted = true;
        stageRun.DateDeleted = DateTime.UtcNow;
        stageRun.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<StageRunDto?> CompleteStageRunAsync(Guid stageRunId, Guid userId, CompleteStageRunRequest request, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && s.Cycle.UserId == userId, cancellationToken);

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

        // Update end date if provided (allows user to specify actual completion date)
        if (request.ActualEndDateTime.HasValue)
        {
            stageRun.EndDateTime = request.ActualEndDateTime.Value;
        }

        stageRun.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStageRunAsync(stageRunId, userId, cancellationToken);
    }

    // Cleaning Run operations
    public async Task<CleaningRunDto?> AddCleaningRunAsync(Guid stageRunId, Guid userId, CreateCleaningRunRequest request, CancellationToken cancellationToken = default)
    {
        var stageRun = await StageRuns
            .Include(s => s.Cycle)
            .Include(s => s.CleaningRun)
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null || stageRun.CleaningRun != null)
            return null;

        var cleaningRun = request.Adapt<CleaningRun>();
        cleaningRun.CleaningRunId = Guid.NewGuid();
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
                    CleaningMaterialId = Guid.NewGuid(),
                    CleaningRunId = cleaningRun.CleaningRunId,
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

    public async Task<bool> CompleteCleaningRunAsync(Guid cleaningRunId, Guid userId, CancellationToken cancellationToken = default)
    {
        var cleaningRun = await CleaningRuns
            .Include(cr => cr.StageRun)
                .ThenInclude(s => s.Cycle)
            .FirstOrDefaultAsync(cr => cr.CleaningRunId == cleaningRunId && cr.StageRun.Cycle.UserId == userId, cancellationToken);

        if (cleaningRun == null)
            return false;

        cleaningRun.Status = CleaningRunStatus.Completed;
        cleaningRun.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteCleaningRunAsync(Guid cleaningRunId, Guid userId, CancellationToken cancellationToken = default)
    {
        var cleaningRun = await CleaningRuns
            .Include(cr => cr.StageRun)
                .ThenInclude(s => s.Cycle)
            .FirstOrDefaultAsync(cr => cr.CleaningRunId == cleaningRunId && cr.StageRun.Cycle.UserId == userId, cancellationToken);

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
            .FirstOrDefaultAsync(s => s.StageRunId == stageRunId && s.Cycle.UserId == userId, cancellationToken);

        if (stageRun == null)
            return null;

        // Check max 10 materials
        if (stageRun.StageMaterials.Count >= 10)
            return null;

        var material = new StageMaterial
        {
            StageMaterialId = Guid.NewGuid(),
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
            .FirstAsync(sm => sm.StageMaterialId == material.StageMaterialId, cancellationToken);

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

    // Photo operations
    public async Task<IEnumerable<CyclePhotoDto>> GetCyclePhotosAsync(Guid cycleId, Guid userId, CancellationToken cancellationToken = default)
    {
        var cycle = await Cycles
            .Include(c => c.StageRuns.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.Photos.Where(p => !p.IsDeleted))
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.CycleId == cycleId && c.UserId == userId && !c.IsDeleted, cancellationToken);

        if (cycle == null)
            return [];

        // Calculate run numbers for each stage
        var runNumbers = CalculateRunNumbers(cycle.StageRuns);

        // Flatten photos from all stages with stage context
        var photos = cycle.StageRuns
            .Where(s => !s.IsDeleted)
            .SelectMany(s => s.Photos
                .Where(p => !p.IsDeleted)
                .OrderBy(p => p.SortOrder)
                .Select(p => new CyclePhotoDto(
                    p.PhotoId,
                    p.Url,
                    p.FileName,
                    p.PhotoType.ToString(),
                    p.Caption,
                    p.SortOrder,
                    p.DateCreated,
                    p.ThumbnailUrl,
                    p.MediumUrl,
                    p.LargeUrl,
                    p.BlurHash,
                    p.Width,
                    p.Height,
                    s.StageRunId,
                    s.StageName,
                    runNumbers.RunNumbers.TryGetValue(s.StageRunId, out var runNum) ? runNum : 1
                )))
            .OrderBy(p => p.DateCreated)
            .ToList();

        return photos;
    }
}
