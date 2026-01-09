using System.Security.Cryptography;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Services;

public class DemoAccountService : IDemoAccountService
{
    private readonly AppDbContext _context;
    private readonly IStorageService _storageService;
    private readonly IImageProcessingService _imageProcessingService;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<DemoAccountService> _logger;
    private readonly Random _random = new(42); // Fixed seed for reproducible data

    // Source user IDs for photo copying
    private static readonly Guid ProdSourceUserId = Guid.Parse("b40acd0e-9c94-4b3c-a248-43d3bb21b0f8");

    // Inventory source names by type
    private static readonly Dictionary<InventorySourceType, string[]> SourceNames = new()
    {
        [InventorySourceType.Store] = new[] { "Rock Hound Shop", "The Gem Store", "Crystal Palace", "Earth's Treasures" },
        [InventorySourceType.Online] = new[] { "eBay", "Etsy - RockCollector123", "Amazon - GemStore", "RockShed.com" },
        [InventorySourceType.Found] = new[] { "Lake Superior Beach", "Colorado River", "Local Hiking Trail", "Backyard Dig" },
        [InventorySourceType.Contact] = new[] { "Rock Show Vendor", "Friend's Collection", "Club Member Trade", "Estate Sale" },
        [InventorySourceType.GemShow] = new[] { "Tucson Gem Show", "Denver Mineral Show", "Local Gem & Mineral Club", "Annual Rock Show" }
    };

    public DemoAccountService(
        AppDbContext context,
        IStorageService storageService,
        IImageProcessingService imageProcessingService,
        IBackgroundJobClient backgroundJobClient,
        ILogger<DemoAccountService> logger)
    {
        _context = context;
        _storageService = storageService;
        _imageProcessingService = imageProcessingService;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public async Task<DemoAccountCreatedResponse> CreateDemoAccountAsync(
        CreateDemoAccountRequest request,
        Guid createdByAdminId,
        CancellationToken cancellationToken = default)
    {
        // 1. Validate email
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken))
            throw new InvalidOperationException("Email already exists");

        // 2. Generate secure password
        var password = GenerateSecurePassword();

        // 3. Generate username from email
        var username = normalizedEmail.Split('@')[0].Replace(".", "_").Replace("-", "_");
        var baseUsername = username;
        var counter = 1;
        while (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower(), cancellationToken))
        {
            username = $"{baseUsername}{counter++}";
        }

        var now = DateTime.UtcNow;

        // 4. Create user
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = normalizedEmail,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            EmailVerified = true,
            DateEmailVerified = now,
            IsDemoAccount = true,
            Role = UserRole.User,
            IsActive = true,
            OnboardingCompleted = true,
            DateOnboardingCompleted = now,
            DateCreated = now,
            DateUpdated = now
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created demo account {UserId} for email {Email}",
            user.UserId, PiiMaskingHelper.MaskEmail(normalizedEmail));

        // 5. Create inventory sources (4-6)
        var sources = await CreateInventorySourcesAsync(user.UserId, cancellationToken);

        // 6. Create inventories (15-25)
        await CreateInventoriesAsync(user.UserId, sources, cancellationToken);

        // 7. Create tumblers and barrels
        await CreateTumblersAsync(user.UserId, cancellationToken);

        // 8. Create 4 months of cycle data
        await CreateCyclesAsync(user.UserId, cancellationToken);

        // 9. Enqueue background job for photo copying
        var sourceUserId = DetermineSourceUserId();
        
        try
        {
            var jobId = _backgroundJobClient.Enqueue<IDemoAccountService>(
                x => x.CopyPhotosForDemoAccountAsync(user.UserId, sourceUserId, createdByAdminId, CancellationToken.None));

            _logger.LogInformation("Enqueued photo copy job {JobId} for demo account {UserId}", jobId, user.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FAILED to enqueue photo copy job for demo account {UserId}", user.UserId);
            throw;
        }

        return new DemoAccountCreatedResponse(
            user.UserId,
            user.Email,
            user.Username,
            password,
            "Demo account created successfully. Photos are being copied in the background.",
            user.DateCreated
        );
    }

    public async Task<List<DemoAccountListDto>> GetDemoAccountsAsync(CancellationToken cancellationToken = default)
    {
        var demoAccounts = await _context.Users
            .Where(u => u.IsDemoAccount)
            .Select(u => new
            {
                u.UserId,
                u.Email,
                u.Username,
                u.DateCreated,
                u.DateLastLogin,
                InventoryCount = u.Inventories.Count(i => !i.IsDeleted),
                CycleCount = u.Cycles.Count,
                PhotoCount = u.Cycles.SelectMany(c => c.StageRuns).SelectMany(sr => sr.Photos).Count(p => !p.IsDeleted)
                    + u.Inventories.SelectMany(i => i.InventoryPhotos).Count()
            })
            .OrderByDescending(u => u.DateCreated)
            .ToListAsync(cancellationToken);

        return demoAccounts.Select(u => new DemoAccountListDto(
            u.UserId,
            u.Email,
            u.Username,
            u.DateCreated,
            u.DateLastLogin,
            u.InventoryCount,
            u.CycleCount,
            u.PhotoCount
        )).ToList();
    }

    public async Task<DemoAccountDeletionResult> DeleteDemoAccountAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // 1. CRITICAL SAFETY CHECK: Verify is_demo_account flag
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        if (!user.IsDemoAccount)
        {
            throw new InvalidOperationException(
                "SAFETY CHECK FAILED: User is not marked as demo account. Cannot delete.");
        }

        _logger.LogWarning("HARD DELETE: Deleting demo account {UserId} ({Email})",
            userId, PiiMaskingHelper.MaskEmail(user.Email));

        // 2. Collect all R2 storage keys for deletion
        var photoKeys = await CollectPhotoStorageKeysAsync(userId, cancellationToken);

        // 3. Delete R2 files in batch
        if (photoKeys.Count > 0 && _storageService.IsConfigured)
        {
            try
            {
                await _storageService.DeleteManyAsync(photoKeys, cancellationToken);
                _logger.LogInformation("Deleted {Count} R2 files for demo user {UserId}",
                    photoKeys.Count, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete R2 files for demo user {UserId}", userId);
                // Continue with database deletion even if R2 deletion fails
            }
        }

        // 4. Delete database records in dependency order
        var deletedRecords = await DeleteDatabaseRecordsAsync(userId, cancellationToken);

        return new DemoAccountDeletionResult(
            Success: true,
            Message: $"Demo account deleted successfully. {photoKeys.Count} photos and {deletedRecords} database records removed.",
            PhotosDeleted: photoKeys.Count,
            RecordsDeleted: deletedRecords
        );
    }

    public async Task<PhotoCopyJobResult> CopyPhotosForDemoAccountAsync(
        Guid demoUserId,
        Guid sourceUserId,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting photo copy job for demo user {DemoUserId} from source {SourceUserId}",
                demoUserId, sourceUserId);

            // Copy inventory photos from source account
            var inventoryPhotosCopied = await CopyInventoryPhotosAsync(demoUserId, sourceUserId, cancellationToken);

            // Copy cycle photos from source account (same source as inventory)
            var cyclePhotosCopied = await CopyCyclePhotosAsync(demoUserId, sourceUserId, cancellationToken);

            _logger.LogInformation("Completed photo copy job for demo user {DemoUserId}: {InventoryPhotos} inventory photos, {CyclePhotos} cycle photos",
                demoUserId, inventoryPhotosCopied, cyclePhotosCopied);

            return new PhotoCopyJobResult(
                Success: true,
                Message: $"Successfully copied {inventoryPhotosCopied} inventory photos and {cyclePhotosCopied} cycle photos",
                PhotosCopied: inventoryPhotosCopied,
                CyclePhotosCopied: cyclePhotosCopied
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to copy photos for demo user {DemoUserId}", demoUserId);
            return new PhotoCopyJobResult(
                Success: false,
                Message: $"Failed to copy photos: {ex.Message}",
                PhotosCopied: 0,
                CyclePhotosCopied: 0
            );
        }
    }

    public async Task<PhotoCopyJobResult> TriggerPhotoCopyAsync(
        Guid demoUserId,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        // Verify user is demo account
        var user = await _context.Users.FindAsync(new object[] { demoUserId }, cancellationToken);
        if (user == null || !user.IsDemoAccount)
        {
            return new PhotoCopyJobResult(
                Success: false,
                Message: "User not found or not a demo account",
                PhotosCopied: 0,
                CyclePhotosCopied: 0
            );
        }

        var sourceUserId = DetermineSourceUserId();
        return await CopyPhotosForDemoAccountAsync(demoUserId, sourceUserId, adminUserId, cancellationToken);
    }

    #region Private Helper Methods

    private static string GenerateSecurePassword()
    {
        const string upperCase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude I, O
        const string lowerCase = "abcdefghjkmnpqrstuvwxyz"; // Exclude i, l, o
        const string digits = "23456789"; // Exclude 0, 1
        const string symbols = "!@#$%&*";
        const string allChars = upperCase + lowerCase + digits + symbols;

        var bytes = RandomNumberGenerator.GetBytes(16);
        var result = new char[16];

        // Ensure at least one of each type
        result[0] = upperCase[bytes[0] % upperCase.Length];
        result[1] = lowerCase[bytes[1] % lowerCase.Length];
        result[2] = digits[bytes[2] % digits.Length];
        result[3] = symbols[bytes[3] % symbols.Length];

        // Fill rest randomly
        for (int i = 4; i < 16; i++)
        {
            result[i] = allChars[bytes[i] % allChars.Length];
        }

        // Shuffle
        return new string(result.OrderBy(_ => Guid.NewGuid()).ToArray());
    }

    private Guid DetermineSourceUserId()
    {
        // Always use production source user for demo photos
        _logger.LogInformation("Using production source user {SourceUserId} for demo photos", ProdSourceUserId);
        return ProdSourceUserId;
    }

    private async Task<List<InventorySource>> CreateInventorySourcesAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var count = _random.Next(4, 7); // 4-6 sources
        var sources = new List<InventorySource>();
        var sourceTypes = Enum.GetValues<InventorySourceType>().Where(st => st != InventorySourceType.Other).ToArray();

        for (int i = 0; i < count; i++)
        {
            var sourceType = sourceTypes[i % sourceTypes.Length];
            var names = SourceNames[sourceType];
            var name = names[_random.Next(names.Length)];

            var source = new InventorySource
            {
                InventorySourceId = Guid.NewGuid(),
                UserId = userId,
                SourceType = sourceType,
                Name = name,
                Location = GenerateLocation(sourceType),
                Notes = sourceType == InventorySourceType.Online ? "Online purchase" : null,
                IsActive = true,
                DateCreated = DateTime.UtcNow.AddDays(-_random.Next(30, 120)),
                DateUpdated = DateTime.UtcNow
            };

            sources.Add(source);
        }

        _context.InventorySources.AddRange(sources);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {Count} inventory sources for demo user {UserId}", count, userId);
        return sources;
    }

    private string? GenerateLocation(InventorySourceType sourceType)
    {
        return sourceType switch
        {
            InventorySourceType.Store => new[] { "Denver, CO", "Phoenix, AZ", "Portland, OR", "Seattle, WA" }[_random.Next(4)],
            InventorySourceType.GemShow => new[] { "Tucson, AZ", "Denver, CO", "Local" }[_random.Next(3)],
            InventorySourceType.Found => new[] { "Lake Superior, MI", "Colorado", "Local Beach", "Mountain Trail" }[_random.Next(4)],
            _ => null
        };
    }

    private async Task CreateInventoriesAsync(
        Guid userId,
        List<InventorySource> sources,
        CancellationToken cancellationToken)
    {
        var count = 5; // 5 inventory records
        var inventories = new List<Inventory>();
        var specimens = await _context.Specimens.Where(s => s.IsActive).ToListAsync(cancellationToken);

        if (specimens.Count == 0)
        {
            _logger.LogWarning("No active specimens found for demo account inventory creation");
            return;
        }

        for (int i = 0; i < count; i++)
        {
            var source = sources[_random.Next(sources.Count)];
            var qualityRating = _random.Next(3, 6);
            var createdDate = DateTime.UtcNow.AddDays(-_random.Next(1, 120));

            var inventory = new Inventory
            {
                InventoryId = Guid.NewGuid(),
                UserId = userId,
                InventorySourceId = source.InventorySourceId,
                Name = $"Mixed Collection {i + 1}",
                AcquiredDate = DateOnly.FromDateTime(createdDate),
                IsDeleted = false,
                DateCreated = createdDate,
                DateUpdated = DateTime.UtcNow
            };

            inventories.Add(inventory);

            // Create 3 inventory specimen links per inventory
            // Calculate per-specimen weight (333g-1666g) and cost ($6-15/lb)
            var selectedSpecimens = specimens.OrderBy(_ => Guid.NewGuid()).Take(3).ToList();


            foreach (var specimen in selectedSpecimens)
            {
                // Each specimen gets a random weight (333-1666g range)
                var specimenWeightGrams = _random.Next(333, 1667);
                var costPerLb = (decimal)(_random.Next(60, 151) / 10.0); // $6-15 per pound
                var specimenCost = Math.Round((specimenWeightGrams / 453.592m) * costPerLb, 2);

                var invSpecimen = new InventorySpecimen
                {
                    InventorySpecimenId = Guid.NewGuid(),
                    InventoryId = inventory.InventoryId,
                    SpecimenId = specimen.SpecimenId,
                    WeightGrams = specimenWeightGrams,
                    Cost = specimenCost,
                    Condition = InventoryCondition.Raw,
                    QualityRating = qualityRating,
                    Status = InventoryStatus.Available,
                    DateCreated = createdDate,
                    DateUpdated = DateTime.UtcNow
                };

                _context.InventorySpecimens.Add(invSpecimen);
            }
        }

        _context.Set<Inventory>().AddRange(inventories);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {Count} inventories with 3 specimens each for demo user {UserId}", count, userId);
    }

    private async Task CreateTumblersAsync(Guid userId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // Create first tumbler - single barrel rotary
        var tumbler1 = new Tumbler
        {
            TumblerId = Guid.NewGuid(),
            UserId = userId,
            Brand = "Lortone",
            Model = "3A",
            TumblerType = TumblerType.Rotary,
            MotorCapacityLbs = 3m,
            IsGeneric = false,
            IsActive = true,
            Notes = "Primary tumbler",
            DateCreated = now.AddMonths(-5),
            DateUpdated = now
        };

        var barrel1 = new Barrel
        {
            BarrelId = Guid.NewGuid(),
            TumblerId = tumbler1.TumblerId,
            BarrelNumber = 1,
            Nickname = "Barrel 1",
            CapacityLbs = 3m,
            IsDedicated = false,
            IsActive = true,
            DateCreated = now.AddMonths(-5),
            DateUpdated = now
        };

        // Create second tumbler - 2 barrel rotary
        var tumbler2 = new Tumbler
        {
            TumblerId = Guid.NewGuid(),
            UserId = userId,
            Brand = "Lortone",
            Model = "33B",
            TumblerType = TumblerType.Rotary,
            MotorCapacityLbs = 6m,
            IsGeneric = false,
            IsActive = true,
            Notes = "Dual barrel tumbler",
            DateCreated = now.AddMonths(-5),
            DateUpdated = now
        };

        var barrel2 = new Barrel
        {
            BarrelId = Guid.NewGuid(),
            TumblerId = tumbler2.TumblerId,
            BarrelNumber = 1,
            Nickname = "Barrel 2",
            CapacityLbs = 3m,
            IsDedicated = false,
            IsActive = true,
            DateCreated = now.AddMonths(-5),
            DateUpdated = now
        };

        var barrel3 = new Barrel
        {
            BarrelId = Guid.NewGuid(),
            TumblerId = tumbler2.TumblerId,
            BarrelNumber = 2,
            Nickname = "Barrel 3",
            CapacityLbs = 3m,
            IsDedicated = false,
            IsActive = true,
            DateCreated = now.AddMonths(-5),
            DateUpdated = now
        };

        _context.Tumblers.AddRange(new[] { tumbler1, tumbler2 });
        _context.Barrels.AddRange(new[] { barrel1, barrel2, barrel3 });
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created 2 tumblers with 3 barrels total for demo user {UserId}", userId);
    }

    private async Task CreateCyclesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        
        var barrels = await _context.Barrels
            .Include(b => b.Tumbler)
            .Where(b => b.Tumbler.UserId == userId && b.IsActive)
            .OrderBy(b => b.BarrelNumber)
            .ToListAsync(cancellationToken);

        if (barrels.Count == 0)
        {
            _logger.LogWarning("No barrels found for demo user {UserId}, skipping cycle creation", userId);
            return;
        }

        var specimens = await _context.Specimens.Where(s => s.IsActive).Take(10).ToListAsync(cancellationToken);

        // Create active cycles for each barrel (3 total)
        var cycleNumber = 1;

        var cycleStartDate = DateTime.UtcNow.AddMonths(-5);
        var currentDate = cycleStartDate;

        foreach (var barrel in barrels)
        {
            // Keep creating cycles for this barrel until we reach current date
            while (currentDate < now)
            {
                var cycleId = Guid.NewGuid();
                var stageRunCount = _random.Next(4, 9); // 4-8 coarse stage runs
                var totalDuration = 0;

                // Calculate cycle duration
                var stage1Duration = _random.Next(5, 8); // 5-7 days for first stage
                totalDuration += stage1Duration * stageRunCount;
                totalDuration += 7 * 3; // 7 days each for stages 2-4

                var cycleEndDate = currentDate.AddDays(totalDuration);
                var isActive = cycleEndDate > now;

                var cycle = new Cycle
                {
                    CycleId = cycleId,
                    UserId = userId,
                    Name = $"Cycle {cycleNumber}",
                    StartDate = DateOnly.FromDateTime(currentDate),
                    Status = isActive ? CycleStatus.Active : CycleStatus.Completed,
                    DateCreated = currentDate,
                    DateUpdated = now
                };

                if (!isActive)
                {
                    cycle.EndDate = DateOnly.FromDateTime(cycleEndDate);
                    cycle.FinalQuality = _random.Next(4, 6);
                }

                _context.Cycles.Add(cycle);

                // Add cycle specimens
                var selectedSpecimens = specimens.OrderBy(_ => Guid.NewGuid()).Take(_random.Next(2, 5)).ToList();
                foreach (var specimen in selectedSpecimens)
                {
                    _context.CycleSpecimens.Add(new CycleSpecimen
                    {
                        CycleId = cycleId,
                        SpecimenId = specimen.SpecimenId,
                        DateCreated = currentDate,
                        DateUpdated = now
                    });
                }

                // Create stage runs
                var stageDate = currentDate;

                // Stage 1 (Coarse): 4-8 runs at 5-7 days each
                for (int i = 0; i < stageRunCount; i++)
                {
                    // Don't create future stage runs
                    if (stageDate >= now)
                        break;

                    var stageRunId = Guid.NewGuid();
                    var duration = _random.Next(5, 8);
                    var stageEndDate = stageDate.AddDays(duration);

                    // Weight: 650-900g begin, 3-15% loss
                    var loadWeightBeforeGrams = _random.Next(650, 901);
                    var lossPercent = (decimal)(_random.Next(3, 16) / 100.0);
                    var loadWeightAfterGrams = (int)(loadWeightBeforeGrams * (1 - lossPercent));

                    var stageRun = new StageRun
                    {
                        StageRunId = stageRunId,
                        CycleId = cycleId,
                        StageName = "Coarse",
                        RunNumber = i + 1,
                        Status = stageEndDate <= now ? StageRunStatus.Completed : StageRunStatus.Active,
                        StartDateTime = stageDate,
                        DurationDays = duration,
                        EndDateTime = stageEndDate <= now ? stageEndDate : null,
                        DurationEstimateEndDate = stageEndDate > now ? stageEndDate : null,
                        LoadWeightBeforeGrams = loadWeightBeforeGrams,
                        LoadWeightAfterGrams = stageEndDate <= now ? loadWeightAfterGrams : null,
                        DateCreated = stageDate,
                        DateUpdated = now
                    };

                    _context.StageRuns.Add(stageRun);
                    _context.Set<StageRunBarrel>().Add(new StageRunBarrel
                    {
                        StageRunId = stageRunId,
                        BarrelId = barrel.BarrelId
                    });

                    stageDate = stageEndDate;
                }

                // Stages 2-4: 7 days each
                var stageNames = new[] { "Medium", "Fine", "Polish" };
                foreach (var stageName in stageNames)
                {
                    if (stageDate >= now)
                        break; // Don't create future stages

                    var stageRunId = Guid.NewGuid();
                    var stageEndDate = stageDate.AddDays(7);

                    var stageRun = new StageRun
                    {
                        StageRunId = stageRunId,
                        CycleId = cycleId,
                        StageName = stageName,
                        RunNumber = 1,
                        Status = stageEndDate <= now ? StageRunStatus.Completed : StageRunStatus.Active,
                        StartDateTime = stageDate,
                        DurationDays = 7,
                        EndDateTime = stageEndDate <= now ? stageEndDate : null,
                        DurationEstimateEndDate = stageEndDate > now ? stageEndDate : null,
                        DateCreated = stageDate,
                        DateUpdated = now
                    };

                    _context.StageRuns.Add(stageRun);
                    _context.Set<StageRunBarrel>().Add(new StageRunBarrel
                    {
                        StageRunId = stageRunId,
                        BarrelId = barrel.BarrelId
                    });

                    stageDate = stageEndDate;
                }

                // Move to next cycle start date
                currentDate = cycleEndDate.AddDays(1);
                cycleNumber++;

                // If this cycle is still active, stop creating more for this barrel
                if (isActive)
                    break;
            }

            // Reset to 5 months ago for next barrel
            currentDate = cycleStartDate;
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Created cycles for 3 barrels starting 5 months ago for demo user {UserId}", userId);
    }

    private async Task<int> CopyInventoryPhotosAsync(
        Guid demoUserId,
        Guid sourceUserId,
        CancellationToken cancellationToken)
    {
        // Get source photos
        var sourcePhotos = await _context.InventoryPhotos
            .Include(ip => ip.Inventory)
            .Where(ip => ip.Inventory.UserId == sourceUserId && !ip.Inventory.IsDeleted)
            .OrderBy(ip => ip.DateCreated)
            .Take(30)
            .ToListAsync(cancellationToken);

        if (sourcePhotos.Count == 0)
        {
            _logger.LogWarning("No inventory photos found for source user {SourceUserId}", sourceUserId);
            return 0;
        }

        // Get demo inventories
        var demoInventories = await _context.Set<Inventory>()
            .Where(i => i.UserId == demoUserId && !i.IsDeleted)
            .ToListAsync(cancellationToken);

        if (demoInventories.Count() == 0)
        {
            _logger.LogWarning("No inventories found for demo user {DemoUserId}", demoUserId);
            return 0;
        }

        // Distribute photos across inventories
        var distribution = DistributePhotosToInventories(sourcePhotos.Count, demoInventories.Count());
        int sourcePhotoIndex = 0;
        var copiedPhotos = new List<InventoryPhoto>();

        for (int i = 0; i < demoInventories.Count() && sourcePhotoIndex < sourcePhotos.Count; i++)
        {
            var inventory = demoInventories[i];
            var photosForThisInventory = distribution[i];

            for (int j = 0; j < photosForThisInventory && sourcePhotoIndex < sourcePhotos.Count; j++)
            {
                var sourcePhoto = sourcePhotos[sourcePhotoIndex++];

                try
                {
                    // Download source photo
                    var stream = await _storageService.GetStreamAsync(sourcePhoto.StorageKey, cancellationToken);
                    if (stream == null)
                    {
                        _logger.LogWarning("Could not download source photo {StorageKey}", sourcePhoto.StorageKey);
                        continue;
                    }

                    // Generate new storage key
                    var extension = Path.GetExtension(sourcePhoto.FileName ?? ".jpg");
                    var folder = $"photos/inventory/{inventory.InventoryId}";
                    var storageKey = $"{Guid.NewGuid():N}{extension}";

                    // Upload to new location
                    var publicUrl = await _storageService.UploadAsync(
                        stream,
                        sourcePhoto.FileName ?? "photo.jpg",
                        folder,
                        storageKey,
                        cancellationToken);

                    // Create new photo record
                    var newPhoto = new InventoryPhoto
                    {
                        InventoryPhotoId = Guid.NewGuid(),
                        InventoryId = inventory.InventoryId,
                        StorageKey = $"{folder}/{storageKey}",
                        Url = publicUrl,
                        FileName = sourcePhoto.FileName,
                        MimeType = sourcePhoto.MimeType,
                        FileSizeBytes = sourcePhoto.FileSizeBytes,
                        Width = sourcePhoto.Width,
                        Height = sourcePhoto.Height,
                        BlurHash = sourcePhoto.BlurHash,
                        SortOrder = j + 1,
                        ProcessingStatus = PhotoProcessingStatus.Completed,
                        DateCreated = DateTime.UtcNow,
                        DateUpdated = DateTime.UtcNow
                    };

                    copiedPhotos.Add(newPhoto);
                    await stream.DisposeAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to copy photo {StorageKey}", sourcePhoto.StorageKey);
                }
            }
        }

        if (copiedPhotos.Count > 0)
        {
            _context.InventoryPhotos.AddRange(copiedPhotos);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Copied {Count} inventory photos for demo user {DemoUserId}",
                copiedPhotos.Count, demoUserId);
        }

        return copiedPhotos.Count;
    }

    private async Task<int> CopyCyclePhotosAsync(
        Guid demoUserId,
        Guid sourceUserId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("CopyCyclePhotosAsync: Starting for demo user {DemoUserId} from source {SourceUserId}", 
            demoUserId, sourceUserId);

        // Get source user's cycle photos
        var sourcePhotos = await _context.Photos
            .Include(p => p.StageRun)
            .ThenInclude(sr => sr.Cycle)
            .Where(p => p.StageRun.Cycle.UserId == sourceUserId && !p.IsDeleted)
            .OrderBy(p => p.DateCreated)
            .Take(20)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("CopyCyclePhotosAsync: Found {Count} source photos", sourcePhotos.Count);

        if (sourcePhotos.Count == 0)
        {
            _logger.LogWarning("No cycle photos found for source user {SourceUserId}", sourceUserId);
            return 0;
        }

        // Get demo user's stage runs
        var demoStageRuns = await _context.StageRuns
            .Include(sr => sr.Cycle)
            .Where(sr => sr.Cycle.UserId == demoUserId)
            .OrderBy(sr => sr.DateCreated)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("CopyCyclePhotosAsync: Found {Count} demo stage runs", demoStageRuns.Count);

        if (demoStageRuns.Count == 0)
        {
            _logger.LogWarning("No stage runs found for demo user {DemoUserId}", demoUserId);
            return 0;
        }

        var copiedPhotos = new List<Photo>();
        var photosPerStageRun = Math.Max(1, sourcePhotos.Count / demoStageRuns.Count);

        _logger.LogInformation("CopyCyclePhotosAsync: Will copy ~{PhotosPerRun} photos per stage run", photosPerStageRun);

        for (int i = 0; i < demoStageRuns.Count && i * photosPerStageRun < sourcePhotos.Count; i++)
        {
            var stageRun = demoStageRuns[i];
            var startIndex = i * photosPerStageRun;
            var photoCount = Math.Min(photosPerStageRun, sourcePhotos.Count - startIndex);

            for (int j = 0; j < photoCount; j++)
            {
                var sourcePhoto = sourcePhotos[startIndex + j];

                try
                {
                    // Download source photo
                    var stream = await _storageService.GetStreamAsync(sourcePhoto.StorageKey, cancellationToken);
                    if (stream == null)
                    {
                        _logger.LogWarning("Could not download source photo {StorageKey}", sourcePhoto.StorageKey);
                        continue;
                    }

                    // Generate new storage key
                    var extension = Path.GetExtension(sourcePhoto.FileName ?? ".jpg");
                    var folder = $"photos/stages/{stageRun.StageRunId}";
                    var storageKey = $"{Guid.NewGuid():N}{extension}";

                    // Upload to new location
                    var publicUrl = await _storageService.UploadAsync(
                        stream,
                        sourcePhoto.FileName ?? "photo.jpg",
                        folder,
                        storageKey,
                        cancellationToken);

                    // Create new photo record with varied photo types
                    var photoType = j switch
                    {
                        0 => PhotoType.Before,
                        1 => PhotoType.During,
                        _ => PhotoType.After
                    };

                    var newPhoto = new Photo
                    {
                        PhotoId = Guid.NewGuid(),
                        StageRunId = stageRun.StageRunId,
                        StorageKey = $"{folder}/{storageKey}",
                        Url = publicUrl,
                        FileName = sourcePhoto.FileName,
                        MimeType = sourcePhoto.MimeType,
                        FileSizeBytes = sourcePhoto.FileSizeBytes,
                        Width = sourcePhoto.Width,
                        Height = sourcePhoto.Height,
                        BlurHash = sourcePhoto.BlurHash,
                        PhotoType = photoType,
                        SortOrder = j + 1,
                        IsDeleted = false,
                        DateCreated = DateTime.UtcNow,
                        DateUpdated = DateTime.UtcNow
                    };

                    copiedPhotos.Add(newPhoto);
                    await stream.DisposeAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to copy cycle photo {StorageKey}", sourcePhoto.StorageKey);
                }
            }
        _logger.LogInformation("CopyCyclePhotosAsync: Prepared {Count} photos to save", copiedPhotos.Count);

        if (copiedPhotos.Count > 0)
        {
            _context.Photos.AddRange(copiedPhotos);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Copied {Count} cycle photos for demo user {DemoUserId}",
                copiedPhotos.Count, demoUserId);
        }
        else
        {
            _logger.LogWarning("CopyCyclePhotosAsync: No photos were prepared for copying!"ncellationToken);
            _logger.LogInformation("Copied {Count} cycle photos for demo user {DemoUserId}",
                copiedPhotos.Count, demoUserId);
        }

        return copiedPhotos.Count;
    }

    private int[] DistributePhotosToInventories(int totalPhotos, int inventoryCount)
    {
        var distribution = new int[inventoryCount];
        var remaining = totalPhotos;

        for (int i = 0; i < inventoryCount && remaining > 0; i++)
        {
            var max = Math.Min(3, remaining);
            var count = _random.Next(1, max + 1);
            distribution[i] = count;
            remaining -= count;
        }

        return distribution;
    }

    private async Task<List<string>> CollectPhotoStorageKeysAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var keys = new List<string>();

        // Collect cycle photo keys
        var cyclePhotoKeys = await _context.Photos
            .Where(p => p.StageRun.Cycle.UserId == userId)
            .Select(p => new[] { p.StorageKey, p.ThumbnailStorageKey, p.MediumStorageKey, p.LargeStorageKey, p.OriginalStorageKey })
            .ToListAsync(cancellationToken);

        foreach (var photoKeys in cyclePhotoKeys)
        {
            keys.AddRange(photoKeys.Where(k => !string.IsNullOrEmpty(k))!);
        }

        // Collect inventory photo keys
        var inventoryPhotoKeys = await _context.InventoryPhotos
            .Where(ip => ip.Inventory.UserId == userId)
            .Select(ip => new[] { ip.StorageKey, ip.ThumbnailStorageKey, ip.MediumStorageKey, ip.LargeStorageKey, ip.OriginalStorageKey })
            .ToListAsync(cancellationToken);

        foreach (var photoKeys in inventoryPhotoKeys)
        {
            keys.AddRange(photoKeys.Where(k => !string.IsNullOrEmpty(k))!);
        }

        return keys.Distinct().ToList();
    }

    private async Task<int> DeleteDatabaseRecordsAsync(Guid userId, CancellationToken cancellationToken)
    {
        // Use raw SQL for efficiency (pattern from DemoUserSeedService)
        var sql = $@"
            -- Phase 1: Remove inventory data
            DELETE FROM inventory_photos WHERE inventory_id IN (
                SELECT inventory_id FROM inventory WHERE user_id = '{userId}'
            );
            DELETE FROM inventory_specimens WHERE inventory_id IN (
                SELECT inventory_id FROM inventory WHERE user_id = '{userId}'
            );
            DELETE FROM inventory WHERE user_id = '{userId}';
            DELETE FROM inventory_sources WHERE user_id = '{userId}';

            -- Phase 2: Remove cycle data
            DELETE FROM photos WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '{userId}'
            );
            DELETE FROM cleaning_materials WHERE cleaning_run_id IN (
                SELECT cr.cleaning_run_id FROM cleaning_runs cr
                JOIN stage_runs sr ON cr.stage_run_id = sr.stage_run_id
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '{userId}'
            );
            DELETE FROM cleaning_runs WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '{userId}'
            );
            DELETE FROM stage_materials WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '{userId}'
            );
            DELETE FROM stage_run_barrels WHERE stage_run_id IN (
                SELECT sr.stage_run_id FROM stage_runs sr
                JOIN cycles c ON sr.cycle_id = c.cycle_id
                WHERE c.user_id = '{userId}'
            );
            DELETE FROM stage_runs WHERE cycle_id IN (
                SELECT cycle_id FROM cycles WHERE user_id = '{userId}'
            );
            DELETE FROM cycle_specimens WHERE cycle_id IN (
                SELECT cycle_id FROM cycles WHERE user_id = '{userId}'
            );
            DELETE FROM cycles WHERE user_id = '{userId}';

            -- Phase 3: Remove equipment
            DELETE FROM barrels WHERE tumbler_id IN (
                SELECT tumbler_id FROM tumblers WHERE user_id = '{userId}'
            );
            DELETE FROM tumblers WHERE user_id = '{userId}';

            -- Phase 4: Remove social data
            DELETE FROM post_photos WHERE post_id IN (
                SELECT post_id FROM posts WHERE user_id = '{userId}'
            );
            DELETE FROM votes WHERE post_id IN (
                SELECT post_id FROM posts WHERE user_id = '{userId}'
            );
            DELETE FROM comment_reports WHERE comment_id IN (
                SELECT comment_id FROM comments WHERE post_id IN (
                    SELECT post_id FROM posts WHERE user_id = '{userId}'
                )
            );
            DELETE FROM comments WHERE post_id IN (
                SELECT post_id FROM posts WHERE user_id = '{userId}'
            );
            DELETE FROM posts WHERE user_id = '{userId}';
            DELETE FROM comments WHERE user_id = '{userId}';
            DELETE FROM votes WHERE user_id = '{userId}';

            -- Phase 5: Remove user data
            DELETE FROM invitation_codes WHERE created_by_user_id = '{userId}';
            DELETE FROM user_settings WHERE user_id = '{userId}';
            DELETE FROM refresh_tokens WHERE user_id = '{userId}';
            DELETE FROM ""UserSessions"" WHERE ""UserId"" = '{userId}';
            DELETE FROM user_specimens WHERE user_id = '{userId}';
            DELETE FROM users WHERE user_id = '{userId}';
        ";

        var result = await _context.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken); // Ensure transaction is committed
        return result;
    }

    #endregion
}
