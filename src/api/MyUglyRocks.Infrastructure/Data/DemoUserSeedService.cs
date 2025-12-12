using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data;

/// <summary>
/// Seeds demo user data with 12 months of realistic tumbling cycles.
/// Demo credentials are configured via environment variables.
/// </summary>
public class DemoUserSeedService
{
    private readonly AppDbContext _context;
    private readonly ILogger _logger;
    private readonly Random _random = new(42); // Fixed seed for reproducible data
    private readonly string? _demoEmail;
    private readonly string? _demoPassword;

    // Demo user ID
    private static readonly Guid DemoUserId = Guid.Parse("00000000-0000-0000-0000-000000000003");

    // Tumbler IDs (fixed for referential integrity)
    private static readonly Guid Tumbler1Id = Guid.Parse("00000000-0000-0000-0001-000000000001");
    private static readonly Guid Tumbler2Id = Guid.Parse("00000000-0000-0000-0001-000000000002");
    private static readonly Guid Tumbler3Id = Guid.Parse("00000000-0000-0000-0001-000000000003");

    // Barrel IDs
    private static readonly Guid Tumbler1Barrel1Id = Guid.Parse("00000000-0000-0000-0002-000000000001");
    private static readonly Guid Tumbler1Barrel2Id = Guid.Parse("00000000-0000-0000-0002-000000000002");
    private static readonly Guid Tumbler2Barrel1Id = Guid.Parse("00000000-0000-0000-0002-000000000003");
    private static readonly Guid Tumbler2Barrel2Id = Guid.Parse("00000000-0000-0000-0002-000000000004");
    private static readonly Guid Tumbler3Barrel1Id = Guid.Parse("00000000-0000-0000-0002-000000000005");

    // Stage names
    private static readonly string[] Stages = { "Coarse", "Medium", "Fine", "Pre-Polish", "Polish" };

    // Detail levels for cycle naming
    private enum DetailLevel { Min, Mix, Full }

    // Rock types for cycles (will be matched against seeded specimens)
    private static readonly string[] RockTypes =
    {
        "Agate", "Jasper", "Carnelian", "Amethyst", "Aventurine", "Tiger Eye",
        "Rose Quartz", "Obsidian", "Petrified Wood", "Bloodstone", "Moss Agate",
        "Lake Superior Agate", "Crazy Lace Agate", "Montana Agate"
    };

    public DemoUserSeedService(AppDbContext context, ILogger logger)
    {
        _context = context;
        _logger = logger;
        _demoEmail = Environment.GetEnvironmentVariable("DEMO_USER_EMAIL");
        _demoPassword = Environment.GetEnvironmentVariable("DEMO_USER_PASSWORD");
    }

    public async Task SeedDemoUserAsync()
    {
        // Skip if credentials not configured
        if (string.IsNullOrEmpty(_demoEmail) || string.IsNullOrEmpty(_demoPassword))
        {
            _logger.LogInformation("Demo user credentials not configured (DEMO_USER_EMAIL/DEMO_USER_PASSWORD), skipping demo seed");
            return;
        }

        var userExists = await _context.Users.AnyAsync(u => u.UserId == DemoUserId);
        var hasCycles = await _context.Cycles.AnyAsync(c => c.UserId == DemoUserId);
        var hasStageRuns = await _context.StageRuns.AnyAsync(sr =>
            _context.Cycles.Any(c => c.CycleId == sr.CycleId && c.UserId == DemoUserId));

        if (userExists && hasCycles && hasStageRuns)
        {
            _logger.LogInformation("Demo user with complete data already exists, skipping");
            return;
        }

        // If partial data exists, clean it up and start fresh
        if (userExists || hasCycles)
        {
            _logger.LogInformation("Found incomplete demo user data, cleaning up...");
            await CleanupIncompleteDataAsync();
        }

        _logger.LogInformation("Seeding demo user data...");

        // Create demo user
        await CreateDemoUserAsync();

        // Create tumblers and barrels
        await CreateTumblersAsync();

        // Create 12 months of cycles with stage runs
        await CreateCyclesAsync();

        _logger.LogInformation("Demo user seeding complete");
    }

    private async Task CleanupIncompleteDataAsync()
    {
        // Delete in order of dependencies using raw SQL for efficiency
        await _context.Database.ExecuteSqlRawAsync(@"
            DELETE FROM photos WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM cleaning_materials WHERE cleaning_run_id IN (
                SELECT cr.cleaning_run_id FROM cleaning_runs cr
                JOIN stage_runs sr ON cr.stage_run_id = sr.stage_run_id
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM cleaning_runs WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM stage_materials WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM stage_run_barrels WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM stage_runs WHERE cycle_id IN (
                SELECT cycle_id FROM cycles WHERE user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM cycle_specimens WHERE cycle_id IN (
                SELECT cycle_id FROM cycles WHERE user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM cycles WHERE user_id = '00000000-0000-0000-0000-000000000003';
            DELETE FROM barrels WHERE tumbler_id IN (
                SELECT tumbler_id FROM tumblers WHERE user_id = '00000000-0000-0000-0000-000000000003'
            );
            DELETE FROM tumblers WHERE user_id = '00000000-0000-0000-0000-000000000003';
            DELETE FROM user_settings WHERE user_id = '00000000-0000-0000-0000-000000000003';
            DELETE FROM users WHERE user_id = '00000000-0000-0000-0000-000000000003';
        ");
        _logger.LogInformation("Cleaned up incomplete demo user data");
    }

    private async Task CreateDemoUserAsync()
    {
        var now = DateTime.UtcNow;
        var user = new User
        {
            UserId = DemoUserId,
            Username = "DemoUser",
            Email = _demoEmail!,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(_demoPassword!),
            DisplayName = "Demo User",
            EmailVerified = true,
            DateEmailVerified = now.AddMonths(-12),
            Role = UserRole.User,
            IsActive = true,
            OnboardingCompleted = true,
            DateOnboardingCompleted = now.AddMonths(-12),
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        _context.Users.Add(user);

        // Add user settings
        var settings = new UserSettings
        {
            UserId = DemoUserId,
            MeasurementSystem = MeasurementSystem.Imperial,
            DateFormat = DateFormat.MMDDYYYY,
            TimeFormat = TimeFormat.TwelveHour,
            Timezone = "America/New_York",
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        _context.UserSettings.Add(settings);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created demo user with configured credentials");
    }

    private async Task CreateTumblersAsync()
    {
        var now = DateTime.UtcNow;

        // Get random barrel nicknames
        var nicknames = await _context.BarrelNicknames
            .Where(n => n.IsActive)
            .OrderBy(n => Guid.NewGuid())
            .Take(5)
            .ToListAsync();

        var nicknameList = nicknames.Select(n => n.Name).ToList();
        while (nicknameList.Count < 5)
        {
            nicknameList.Add($"Barrel {nicknameList.Count + 1}");
        }

        // Tumbler 1: Rotary, 2 barrels @ 3lb each, Stage 1 only
        var tumbler1 = new Tumbler
        {
            TumblerId = Tumbler1Id,
            UserId = DemoUserId,
            Brand = "Lortone",
            Model = "33B",
            TumblerType = TumblerType.Rotary,
            MotorCapacityLbs = 6m,
            IsGeneric = false,
            IsActive = true,
            Notes = "Dedicated to Stage 1 coarse grinding. Rocks go to Tumbler 3 after.",
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        var t1b1 = new Barrel
        {
            BarrelId = Tumbler1Barrel1Id,
            TumblerId = Tumbler1Id,
            BarrelNumber = 1,
            Nickname = nicknameList[0],
            CapacityLbs = 3m,
            IsDedicated = true,
            DedicatedStages = new[] { "Coarse" },
            IsActive = true,
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        var t1b2 = new Barrel
        {
            BarrelId = Tumbler1Barrel2Id,
            TumblerId = Tumbler1Id,
            BarrelNumber = 2,
            Nickname = nicknameList[1],
            CapacityLbs = 3m,
            IsDedicated = true,
            DedicatedStages = new[] { "Coarse" },
            IsActive = true,
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        // Tumbler 2: Rotary, 2 barrels @ 6lb each
        // Barrel 1: Stage 1 only, then goes to Tumbler 3
        // Barrel 2: Stages 1-5
        var tumbler2 = new Tumbler
        {
            TumblerId = Tumbler2Id,
            UserId = DemoUserId,
            Brand = "Lortone",
            Model = "QT66",
            TumblerType = TumblerType.Rotary,
            MotorCapacityLbs = 12m,
            IsGeneric = false,
            IsActive = true,
            Notes = "Main workhorse tumbler. Barrel 1 for coarse only, Barrel 2 runs all stages.",
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        var t2b1 = new Barrel
        {
            BarrelId = Tumbler2Barrel1Id,
            TumblerId = Tumbler2Id,
            BarrelNumber = 1,
            Nickname = nicknameList[2],
            CapacityLbs = 6m,
            IsDedicated = true,
            DedicatedStages = new[] { "Coarse" },
            IsActive = true,
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        var t2b2 = new Barrel
        {
            BarrelId = Tumbler2Barrel2Id,
            TumblerId = Tumbler2Id,
            BarrelNumber = 2,
            Nickname = nicknameList[3],
            CapacityLbs = 6m,
            IsDedicated = false,
            IsActive = true,
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        // Tumbler 3: Lot-o-Tumbler Vibratory, 1 barrel @ 4.5lb, Stages 2-5 only
        var tumbler3 = new Tumbler
        {
            TumblerId = Tumbler3Id,
            UserId = DemoUserId,
            Brand = "Lot-o-Tumbler",
            Model = "Single Barrel",
            TumblerType = TumblerType.Vibratory,
            MotorCapacityLbs = 4.5m,
            IsGeneric = false,
            IsActive = true,
            Notes = "Fast vibratory for stages 2-5. 1-2 days per stage.",
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        var t3b1 = new Barrel
        {
            BarrelId = Tumbler3Barrel1Id,
            TumblerId = Tumbler3Id,
            BarrelNumber = 1,
            Nickname = nicknameList[4],
            CapacityLbs = 4.5m,
            IsDedicated = true,
            DedicatedStages = new[] { "Medium", "Fine", "Pre-Polish", "Polish" },
            IsActive = true,
            DateCreated = now.AddMonths(-12),
            DateUpdated = now
        };

        _context.Tumblers.AddRange(tumbler1, tumbler2, tumbler3);
        _context.Barrels.AddRange(t1b1, t1b2, t2b1, t2b2, t3b1);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created 3 tumblers with 5 barrels total");
    }

    private async Task CreateCyclesAsync()
    {
        _logger.LogInformation("Starting cycle creation...");

        // Get materials for stage runs
        var materials = await _context.Materials.ToListAsync();
        _logger.LogInformation("Loaded {Count} materials", materials.Count);
        var coarseMaterial = materials.FirstOrDefault(m => m.CommonName.Contains("Coarse (60/90)"));
        var mediumMaterial = materials.FirstOrDefault(m => m.CommonName.Contains("Medium (120/220)"));
        var fineMaterial = materials.FirstOrDefault(m => m.CommonName.Contains("Fine (500)"));
        var prePolishMaterial = materials.FirstOrDefault(m => m.CommonName.Contains("Pre-Polish (600)"));
        var polishMaterial = materials.FirstOrDefault(m => m.CommonName.Contains("Aluminum Oxide Polish"));
        var cleaningMaterial = materials.FirstOrDefault(m => m.IsCleaning && m.CommonName.Contains("Borax"));

        // Get specimens for cycles
        var specimens = await _context.Specimens
            .Where(s => s.IsActive)
            .ToListAsync();
        _logger.LogInformation("Loaded {Count} specimens", specimens.Count);

        var now = DateTime.UtcNow;
        var startDate = now.AddMonths(-12);
        var currentDate = startDate;

        // Track barrel availability (end date when barrel becomes free)
        var barrelAvailability = new Dictionary<Guid, DateTime>
        {
            { Tumbler1Barrel1Id, startDate },
            { Tumbler1Barrel2Id, startDate },
            { Tumbler2Barrel1Id, startDate },
            { Tumbler2Barrel2Id, startDate },
            { Tumbler3Barrel1Id, startDate }
        };

        var cycles = new List<Cycle>();
        var stageRuns = new List<StageRun>();
        var stageRunBarrels = new List<StageRunBarrel>();
        var stageMaterials = new List<StageMaterial>();
        var cleaningRuns = new List<CleaningRun>();
        var cleaningMaterials = new List<CleaningMaterial>();
        var cycleSpecimens = new List<CycleSpecimen>();
        var photos = new List<Photo>();

        int cycleCount = 0;
        int abandonedCount = 0;
        const int maxCycles = 50; // Limit cycles to prevent infinite loop

        _logger.LogInformation("Starting cycle generation loop from {StartDate} to {Now}", startDate, now);

        // Pre-calculate cycle start dates spread across 12 months
        // Leave room for cycles to complete (max ~60 days for full rotary cycle)
        var cycleStartDates = new List<DateTime>();
        var safeEndDate = now.AddDays(-60); // Don't start cycles within last 60 days so they can complete
        var dateSpan = (safeEndDate - startDate).TotalDays;
        var daysPerCycle = dateSpan / (maxCycles - 5); // Reserve 5 slots for recent/active cycles

        // Generate completed cycles spread across the past
        for (int i = 0; i < maxCycles - 5; i++)
        {
            cycleStartDates.Add(startDate.AddDays(i * daysPerCycle + _random.Next(0, (int)(daysPerCycle / 2))));
        }

        // Add 5 more recent cycles (some will be in-progress)
        cycleStartDates.Add(now.AddDays(-45)); // Should be near completion
        cycleStartDates.Add(now.AddDays(-30)); // Mid-cycle
        cycleStartDates.Add(now.AddDays(-20)); // Early stages
        cycleStartDates.Add(now.AddDays(-10)); // Just started
        cycleStartDates.Add(now.AddDays(-3));  // Brand new

        // Assign workflows in rotation to distribute across all barrels
        var workflowRotation = new[] { "T2B2_AllStages", "T1_to_T3", "T2B1_to_T3", "T1_to_T3" };

        // Generate cycles
        foreach (var startingDate in cycleStartDates.Where(d => d < now))
        {
            var workflowIndex = cycleCount % workflowRotation.Length;
            var workflow = workflowRotation[workflowIndex];
            var barrelId = workflow switch
            {
                "T2B2_AllStages" => Tumbler2Barrel2Id,
                "T1_to_T3" => cycleCount % 2 == 0 ? Tumbler1Barrel1Id : Tumbler1Barrel2Id,
                "T2B1_to_T3" => Tumbler2Barrel1Id,
                _ => Tumbler2Barrel2Id
            };

            currentDate = startingDate;
            _logger.LogDebug("Cycle {CycleNum}: Using workflow {Workflow} starting {Date}",
                cycleCount + 1, workflow, currentDate);

            cycleCount++;

            // Determine detail level (rotate through min/mix/full)
            var detailLevel = (DetailLevel)(cycleCount % 3);

            // Should this be abandoned? (2 total)
            bool isAbandoned = abandonedCount < 2 && cycleCount % 15 == 0;
            if (isAbandoned) abandonedCount++;

            // Pick rock types for this cycle (1-3 types)
            var rockTypeCount = _random.Next(1, 4);
            var selectedRockTypes = RockTypes.OrderBy(_ => _random.Next()).Take(rockTypeCount).ToList();
            var rockName = string.Join(" & ", selectedRockTypes);

            // Create cycle
            var cycleId = Guid.NewGuid();
            var cycleStartDate = DateOnly.FromDateTime(currentDate);
            var cycleName = $"[{detailLevel.ToString().ToUpper()}] {rockName} - {cycleStartDate:MMM yyyy}";

            var cycle = new Cycle
            {
                CycleId = cycleId,
                UserId = DemoUserId,
                Name = cycleName,
                StartDate = cycleStartDate,
                Status = CycleStatus.Active,
                Notes = detailLevel != DetailLevel.Min ? GetRandomNotes() : null,
                DateCreated = currentDate,
                DateUpdated = currentDate
            };

            // Add specimens to cycle
            foreach (var rockType in selectedRockTypes)
            {
                var specimen = specimens.FirstOrDefault(s =>
                    s.CommonName.Contains(rockType, StringComparison.OrdinalIgnoreCase));
                if (specimen != null)
                {
                    cycleSpecimens.Add(new CycleSpecimen
                    {
                        CycleId = cycleId,
                        SpecimenId = specimen.SpecimenId,
                        DateCreated = currentDate,
                        DateUpdated = currentDate
                    });
                }
            }

            // Generate stage runs based on workflow
            var stageRunDate = currentDate;
            var stageIndex = 0;
            var maxStage = isAbandoned ? _random.Next(1, 3) : 5; // Abandoned cycles stop early
            var hasActiveStage = false; // Track if we've already assigned an Active stage to this cycle

            foreach (var (stageName, stageBarrelId, isVibratory) in GetWorkflowStages(workflow, barrelId))
            {
                stageIndex++;
                if (stageIndex > maxStage) break;

                // Determine how many runs of this stage (Coarse needs 2-6, others just 1)
                var durationDaysPerRun = GetStageDuration(stageName, isVibratory);
                var numberOfRuns = isVibratory ? 1 : (stageName == "Coarse" ? _random.Next(2, 7) : 1);

                // Create multiple StageRun records for this stage
                for (int runNumber = 1; runNumber <= numberOfRuns; runNumber++)
                {
                    var runStartDate = stageRunDate;
                    var estimatedEndDate = runStartDate.AddDays(durationDaysPerRun);

                    // Don't create future stages - break if start date is in the future
                    if (runStartDate > now)
                    {
                        break;
                    }

                    // Determine status based on dates
                    // Only ONE stage can be Active per cycle - others become Planned
                    bool isCompleted = estimatedEndDate < now && !isAbandoned;
                    bool wouldBeActive = runStartDate <= now && estimatedEndDate >= now && !isAbandoned;
                    bool isCurrentlyActive = wouldBeActive && !hasActiveStage; // Only if we haven't assigned an active stage yet

                    StageRunStatus stageStatus;
                    if (isCompleted)
                        stageStatus = StageRunStatus.Completed;
                    else if (isCurrentlyActive)
                    {
                        stageStatus = StageRunStatus.Active;
                        hasActiveStage = true; // Mark that we've assigned the active stage
                    }
                    else if (wouldBeActive)
                        stageStatus = StageRunStatus.Planned; // Would be active but another stage is already active
                    else
                        stageStatus = StageRunStatus.Completed; // If not active and not future, it's completed

                    var stageRunId = Guid.NewGuid();

                    var stageRun = new StageRun
                    {
                        StageRunId = stageRunId,
                        CycleId = cycleId,
                        StageName = stageName,
                        RunNumber = runNumber,
                        Status = stageStatus,
                        StartDateTime = runStartDate,
                        DurationDays = durationDaysPerRun,
                        DurationHours = 0,
                        // EndDateTime: only set for completed/aborted stages, null while active/planned
                        EndDateTime = isCompleted ? estimatedEndDate : null,
                        // DurationEstimateEndDate: calculated estimate while active or planned, null when completed
                        DurationEstimateEndDate = !isCompleted ? estimatedEndDate : null,
                        DateCreated = runStartDate,
                        DateUpdated = isCompleted ? estimatedEndDate : now
                    };

                    // Add detailed fields based on detail level
                    if (detailLevel != DetailLevel.Min)
                    {
                        stageRun.LoadWeightBeforeGrams = _random.Next(800, 2000);
                        stageRun.FillLevelPercent = _random.Next(60, 85);
                        stageRun.WaterLevel = (WaterLevel)_random.Next(0, 4);
                        stageRun.WaterAmountMl = _random.Next(200, 500);

                        if (isCompleted)
                        {
                            stageRun.LoadWeightAfterGrams = stageRun.LoadWeightBeforeGrams - _random.Next(50, 200);
                            stageRun.ResultRating = _random.Next(3, 6);
                        }
                    }

                    if (detailLevel == DetailLevel.Full)
                    {
                        stageRun.BarrelRpm = isVibratory ? null : _random.Next(20, 35);
                        stageRun.IsRpmEstimated = !isVibratory;

                        if (isCompleted)
                        {
                            stageRun.ResultShapeRounding = _random.Next(60, 100);
                            stageRun.ResultScratchLevel = _random.Next(0, 40);
                            stageRun.ResultPitting = _random.Next(0, 30);
                            stageRun.ResultShine = stageName == "Polish" ? _random.Next(70, 100) : _random.Next(20, 60);
                            stageRun.LessonsLearned = GetRandomLessonLearned(stageName);
                            stageRun.NextAction = StageNextAction.Advance;
                        }

                        if (runNumber > 1)
                            stageRun.Notes = $"Run {runNumber} of {numberOfRuns} for this stage.";
                    }

                    stageRuns.Add(stageRun);

                    // Link barrel to stage run
                    stageRunBarrels.Add(new StageRunBarrel
                    {
                        StageRunId = stageRunId,
                        BarrelId = stageBarrelId
                    });

                    // Add materials
                    var material = stageName switch
                    {
                        "Coarse" => coarseMaterial,
                        "Medium" => mediumMaterial,
                        "Fine" => fineMaterial,
                        "Pre-Polish" => prePolishMaterial,
                        "Polish" => polishMaterial,
                        _ => null
                    };

                    if (material != null && detailLevel != DetailLevel.Min)
                    {
                        stageMaterials.Add(new StageMaterial
                        {
                            StageMaterialId = Guid.NewGuid(),
                            StageRunId = stageRunId,
                            MaterialId = material.MaterialId,
                            DisplayAmount = _random.Next(2, 5),
                            DisplayUnit = "tbsp",
                            AmountGrams = _random.Next(30, 75),
                            SortOrder = 1,
                            DateCreated = runStartDate,
                            DateUpdated = runStartDate
                        });
                    }

                    // Add cleaning run randomly (more common for FULL detail, only on last run of stage)
                    bool addCleaning = (detailLevel == DetailLevel.Full ||
                                       (detailLevel == DetailLevel.Mix && _random.Next(0, 3) == 0))
                                       && runNumber == numberOfRuns; // Only on last run
                    if (addCleaning && isCompleted && cleaningMaterial != null)
                    {
                        var cleaningRunId = Guid.NewGuid();
                        cleaningRuns.Add(new CleaningRun
                        {
                            CleaningRunId = cleaningRunId,
                            StageRunId = stageRunId,
                            DurationMinutes = _random.Next(15, 60),
                            Purpose = stageName == "Polish" ? CleaningPurpose.FinalBurnish : CleaningPurpose.PostStageClean,
                            Status = CleaningRunStatus.Completed,
                            ReminderEnabled = false,
                            ResultNotes = detailLevel == DetailLevel.Full ? "Rocks cleaned thoroughly" : null,
                            DateCreated = estimatedEndDate,
                            DateUpdated = estimatedEndDate
                        });

                        cleaningMaterials.Add(new CleaningMaterial
                        {
                            CleaningMaterialId = Guid.NewGuid(),
                            CleaningRunId = cleaningRunId,
                            MaterialId = cleaningMaterial.MaterialId,
                            DisplayAmount = 1,
                            DisplayUnit = "tbsp",
                            AmountGrams = 15,
                            SortOrder = 1,
                            DateCreated = estimatedEndDate,
                            DateUpdated = estimatedEndDate
                        });
                    }

                    // Add photos at key stages (only on first run for before, last run for after)
                    if (isCompleted || isCurrentlyActive)
                    {
                        // Stage 1 Run 1 - Before photo
                        if (stageName == "Coarse" && runNumber == 1)
                        {
                            photos.Add(CreatePlaceholderPhoto(stageRunId, PhotoType.Before, "stage1_before", runStartDate));
                        }
                        // Stage 3 - During photos
                        else if (stageName == "Fine" && isCompleted)
                        {
                            photos.Add(CreatePlaceholderPhoto(stageRunId, PhotoType.During, "stage3_during_1", runStartDate.AddDays(1)));
                            photos.Add(CreatePlaceholderPhoto(stageRunId, PhotoType.During, "stage3_during_2", runStartDate.AddDays(2)));
                        }
                        // Stage 5 - After photo
                        else if (stageName == "Polish" && isCompleted)
                        {
                            photos.Add(CreatePlaceholderPhoto(stageRunId, PhotoType.After, "stage5_after", estimatedEndDate));
                        }
                    }

                    // Update barrel availability
                    if (barrelAvailability[stageBarrelId] < estimatedEndDate)
                    {
                        barrelAvailability[stageBarrelId] = estimatedEndDate;
                    }

                    // Move to next run's start date
                    stageRunDate = estimatedEndDate;
                } // end for loop (runNumber)
            }

            // Update cycle status and end date
            if (stageRunDate < now && !isAbandoned)
            {
                cycle.Status = CycleStatus.Completed;
                cycle.EndDate = DateOnly.FromDateTime(stageRunDate);
                cycle.FinalQuality = _random.Next(3, 6);
                cycle.DifficultyRating = _random.Next(2, 5);
            }
            else if (isAbandoned)
            {
                cycle.Status = CycleStatus.Completed;
                cycle.Notes = (cycle.Notes ?? "") + " [ABANDONED - rocks had too many fractures]";
            }

            cycles.Add(cycle);

            // Move to next cycle start (allow some overlap)
            currentDate = currentDate.AddDays(_random.Next(5, 15));
        }

        _logger.LogInformation("Generated {CycleCount} cycles, {StageRunCount} stage runs, now saving to database...",
            cycles.Count, stageRuns.Count);

        // Bulk insert all data
        try
        {
            _context.Cycles.AddRange(cycles);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved {Count} cycles", cycles.Count);

            _context.StageRuns.AddRange(stageRuns);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved {Count} stage runs", stageRuns.Count);

            _context.Set<StageRunBarrel>().AddRange(stageRunBarrels);
            _context.StageMaterials.AddRange(stageMaterials);
            _context.CycleSpecimens.AddRange(cycleSpecimens);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved stage run barrels, materials, and specimens");

            _context.CleaningRuns.AddRange(cleaningRuns);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved {Count} cleaning runs", cleaningRuns.Count);

            _context.CleaningMaterials.AddRange(cleaningMaterials);
            _context.Photos.AddRange(photos);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved cleaning materials and {Count} photos", photos.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving demo cycle data");
            throw;
        }

        _logger.LogInformation("Created {CycleCount} cycles with stage runs, materials, cleaning runs, and photos", cycles.Count);
    }

    private (Guid barrelId, string workflow) SelectNextAvailableWorkflow(
        Dictionary<Guid, DateTime> availability, DateTime currentDate)
    {
        // Workflow options:
        // 1. Tumbler1 Barrel1/2 -> Tumbler3 (Stage 1 rotary, stages 2-5 vibratory)
        // 2. Tumbler2 Barrel1 -> Tumbler3 (Stage 1 rotary, stages 2-5 vibratory)
        // 3. Tumbler2 Barrel2 (all stages rotary)

        // Check Tumbler 2 Barrel 2 first (independent, all stages)
        if (availability[Tumbler2Barrel2Id] <= currentDate)
        {
            return (Tumbler2Barrel2Id, "T2B2_AllStages");
        }

        // Check Tumbler 1 barrels (need Tumbler 3 available too)
        if (availability[Tumbler1Barrel1Id] <= currentDate && availability[Tumbler3Barrel1Id] <= currentDate)
        {
            return (Tumbler1Barrel1Id, "T1_to_T3");
        }
        if (availability[Tumbler1Barrel2Id] <= currentDate && availability[Tumbler3Barrel1Id] <= currentDate)
        {
            return (Tumbler1Barrel2Id, "T1_to_T3");
        }

        // Check Tumbler 2 Barrel 1 (needs Tumbler 3 available)
        if (availability[Tumbler2Barrel1Id] <= currentDate && availability[Tumbler3Barrel1Id] <= currentDate)
        {
            return (Tumbler2Barrel1Id, "T2B1_to_T3");
        }

        return (Guid.Empty, "");
    }

    private IEnumerable<(string stageName, Guid barrelId, bool isVibratory)> GetWorkflowStages(
        string workflow, Guid startBarrelId)
    {
        return workflow switch
        {
            "T2B2_AllStages" => new[]
            {
                ("Coarse", Tumbler2Barrel2Id, false),
                ("Medium", Tumbler2Barrel2Id, false),
                ("Fine", Tumbler2Barrel2Id, false),
                ("Pre-Polish", Tumbler2Barrel2Id, false),
                ("Polish", Tumbler2Barrel2Id, false)
            },
            "T1_to_T3" => new[]
            {
                ("Coarse", startBarrelId, false),
                ("Medium", Tumbler3Barrel1Id, true),
                ("Fine", Tumbler3Barrel1Id, true),
                ("Pre-Polish", Tumbler3Barrel1Id, true),
                ("Polish", Tumbler3Barrel1Id, true)
            },
            "T2B1_to_T3" => new[]
            {
                ("Coarse", Tumbler2Barrel1Id, false),
                ("Medium", Tumbler3Barrel1Id, true),
                ("Fine", Tumbler3Barrel1Id, true),
                ("Pre-Polish", Tumbler3Barrel1Id, true),
                ("Polish", Tumbler3Barrel1Id, true)
            },
            _ => Array.Empty<(string, Guid, bool)>()
        };
    }

    private int GetStageDuration(string stageName, bool isVibratory)
    {
        if (isVibratory)
        {
            // Vibratory: 1-2 days per stage
            return _random.Next(1, 3);
        }

        // Rotary durations
        return stageName switch
        {
            "Coarse" => _random.Next(7, 11),   // 7-10 days
            "Medium" => _random.Next(7, 11),   // 7-10 days
            "Fine" => _random.Next(7, 11),     // 7-10 days
            "Pre-Polish" => _random.Next(5, 8), // 5-7 days
            "Polish" => _random.Next(5, 8),     // 5-7 days
            _ => 7
        };
    }

    private Photo CreatePlaceholderPhoto(Guid stageRunId, PhotoType photoType, string name, DateTime date)
    {
        // Create placeholder photo entries using placehold.co service
        // Colors: Before=brown (rough rocks), During=gray (processing), After=teal (polished)
        var fileName = $"{name}_{stageRunId:N}.jpg";
        var (bgColor, textColor, label) = photoType switch
        {
            PhotoType.Before => ("8B4513", "FFFFFF", "BEFORE+-+Rough+Rocks"),
            PhotoType.During => ("708090", "FFFFFF", "DURING+-+Processing"),
            PhotoType.After => ("20B2AA", "FFFFFF", "AFTER+-+Polished"),
            _ => ("CCCCCC", "333333", "Photo")
        };

        return new Photo
        {
            PhotoId = Guid.NewGuid(),
            StageRunId = stageRunId,
            StorageKey = $"demo/{stageRunId}/{photoType.ToString().ToLower()}/{fileName}",
            // Use placehold.co for actual working placeholder images
            Url = $"https://placehold.co/800x600/{bgColor}/{textColor}?text={label}",
            FileName = fileName,
            MimeType = "image/jpeg",
            FileSizeBytes = 50000,
            Width = 800,
            Height = 600,
            PhotoType = photoType,
            SortOrder = photoType == PhotoType.During ? _random.Next(1, 3) : 1,
            DateCreated = date,
            DateUpdated = date
        };
    }

    private string GetRandomGoal()
    {
        var goals = new[]
        {
            "Get a high polish on these specimens",
            "Practice new grit sequence",
            "Prepare stones for wire wrapping",
            "Test vibratory finish vs rotary",
            "Create cabochon-quality stones",
            "Gift-quality polish for holiday presents",
            "Experiment with extended coarse stage"
        };
        return goals[_random.Next(goals.Length)];
    }

    private string GetRandomNotes()
    {
        var notes = new[]
        {
            "Mixed batch from recent rock hunting trip",
            "Purchased rough from online vendor",
            "Beach finds from summer vacation",
            "Estate sale find - need to test hardness",
            "Club member trade specimens",
            "Second run after initial sort",
            "Premium grade material"
        };
        return notes[_random.Next(notes.Length)];
    }

    private string GetRandomLessonLearned(string stageName)
    {
        var lessons = stageName switch
        {
            "Coarse" => new[]
            {
                "Should have sorted harder stones separately",
                "Good shaping achieved, some pits remain",
                "Extended by 2 days for stubborn material",
                "Fill level was perfect this run"
            },
            "Medium" => new[]
            {
                "Scratches from coarse mostly removed",
                "Some stones needed extra time",
                "Good progression from coarse stage",
                "Water level critical for this stage"
            },
            "Fine" => new[]
            {
                "Surface getting smooth",
                "Ready for pre-polish",
                "Minor pitting still visible on some",
                "Excellent results on agates"
            },
            "Pre-Polish" => new[]
            {
                "Almost mirror finish developing",
                "Some stones showing great luster",
                "May need one more day",
                "Surface prep looking good"
            },
            "Polish" => new[]
            {
                "Excellent shine achieved!",
                "Best batch yet",
                "A few stones need re-running",
                "Mirror finish on most pieces"
            },
            _ => new[] { "Good progress" }
        };
        return lessons[_random.Next(lessons.Length)];
    }
}
