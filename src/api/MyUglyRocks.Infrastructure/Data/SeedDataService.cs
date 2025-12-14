using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data;

public class SeedDataService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SeedDataService> _logger;
    private readonly IStorageService _storageService;
    private readonly IImageProcessingService _imageProcessingService;
    private static readonly Guid SystemUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid TestUserId = Guid.Parse("00000000-0000-0000-0000-000000000002");

    // CSV seed data path - BaseDirectory is bin/Debug/net9.0, go up 6 levels to solution root
    private static string GetCsvPath(string fileName) =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..", "docs", "seed-data", fileName));

    // Parse CSV line handling quoted fields
    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var inQuotes = false;
        var field = new System.Text.StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    field.Append('"');
                    i++; // Skip escaped quote
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(field.ToString().Trim());
                field.Clear();
            }
            else
            {
                field.Append(c);
            }
        }
        result.Add(field.ToString().Trim());
        return result;
    }

    public SeedDataService(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<SeedDataService> logger,
        IStorageService storageService,
        IImageProcessingService imageProcessingService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _storageService = storageService;
        _imageProcessingService = imageProcessingService;
    }

    public async Task SeedAllAsync()
    {
        await EnsureSystemUserAsync();
        await EnsureTestUserAsync();
        await EnsureAdminUserAsync();
        await SeedSpecimensAsync();
        await SeedMaterialsAsync();
        await SeedTumblerModelsAsync();
        await SeedBarrelNicknamesAsync();
        await SeedDemoUserAsync();
    }

    private async Task SeedDemoUserAsync()
    {
        var demoSeedService = new DemoUserSeedService(
            _context,
            _logger,
            _storageService,
            _imageProcessingService);
        await demoSeedService.SeedDemoUserAsync();
    }

    private async Task EnsureSystemUserAsync()
    {
        if (!await _context.Users.AnyAsync(u => u.UserId == SystemUserId))
        {
            _context.Users.Add(new User
            {
                UserId = SystemUserId,
                Username = "system",
                Email = "system@myuglyrocks.local",
                PasswordHash = "SYSTEM_USER_NO_LOGIN",
                DisplayName = "System",
                EmailVerified = true,
                Role = UserRole.Admin,
                DateCreated = DateTime.UtcNow,
                DateUpdated = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created system user for seed data");
        }
    }

    private async Task EnsureTestUserAsync()
    {
        if (!await _context.Users.AnyAsync(u => u.UserId == TestUserId))
        {
            var now = DateTime.UtcNow;
            _context.Users.Add(new User
            {
                UserId = TestUserId,
                Username = "testuser",
                Email = "test@myuglyrocks.local",
                // Password: "Test123!" - pre-hashed for convenience
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
                DisplayName = "Test User",
                EmailVerified = true,
                DateEmailVerified = now,
                Role = UserRole.User,
                IsActive = true,
                OnboardingCompleted = true,
                DateOnboardingCompleted = now,
                DateCreated = now,
                DateUpdated = now
            });
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created test user (test@myuglyrocks.local / Test123!)");
        }
    }

    /// <summary>
    /// Creates an admin user from ADMIN_EMAIL environment variable if set.
    /// The admin must use "Forgot Password" to set their password on first login.
    /// </summary>
    private async Task EnsureAdminUserAsync()
    {
        var adminEmail = _configuration["ADMIN_EMAIL"];
        if (string.IsNullOrWhiteSpace(adminEmail))
        {
            _logger.LogDebug("ADMIN_EMAIL not configured, skipping admin user seed");
            return;
        }

        var normalizedEmail = adminEmail.Trim().ToLowerInvariant();

        // Check if admin user already exists
        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            _logger.LogDebug("Admin user {Email} already exists", normalizedEmail);
            return;
        }

        var now = DateTime.UtcNow;

        // Generate a random unusable password (user must use forgot password to set real password)
        var unusablePassword = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString() + Guid.NewGuid().ToString());

        // Generate username from email (before @)
        var username = normalizedEmail.Split('@')[0].Replace(".", "_").Replace("-", "_");
        // Ensure username is unique
        var baseUsername = username;
        var counter = 1;
        while (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
        {
            username = $"{baseUsername}{counter++}";
        }

        _context.Users.Add(new User
        {
            UserId = Guid.NewGuid(),
            Username = username,
            Email = normalizedEmail,
            PasswordHash = unusablePassword,
            DisplayName = "Admin",
            EmailVerified = true, // Pre-verified so they can use forgot password
            DateEmailVerified = now,
            Role = UserRole.Admin,
            IsActive = true,
            DateCreated = now,
            DateUpdated = now
        });

        await _context.SaveChangesAsync();
        _logger.LogInformation("Created admin user {Email} - use Forgot Password to set password", normalizedEmail);
    }

    private async Task SeedSpecimensAsync()
    {
        if (await _context.Specimens.AnyAsync())
        {
            _logger.LogInformation("Specimens already seeded, skipping");
            return;
        }

        var specimens = GetSpecimenSeedData();
        _context.Specimens.AddRange(specimens);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Seeded {Count} specimens", specimens.Count);
    }

    private async Task SeedMaterialsAsync()
    {
        if (await _context.Materials.AnyAsync())
        {
            _logger.LogInformation("Materials already seeded, skipping");
            return;
        }

        var materials = GetMaterialSeedData();
        _context.Materials.AddRange(materials);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Seeded {Count} materials", materials.Count);
    }

    private List<Specimen> GetSpecimenSeedData()
    {
        var now = DateTime.UtcNow;
        var specimens = new List<Specimen>();

        var csvPath = GetCsvPath("specimens-seed.csv");
        if (!File.Exists(csvPath))
        {
            _logger.LogWarning("Specimens CSV not found at {Path}, skipping", csvPath);
            return specimens;
        }

        var lines = File.ReadAllLines(csvPath);
        var isFirstDataLine = true;
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
                continue;

            if (isFirstDataLine)
            {
                isFirstDataLine = false;
                continue;
            }

            var parts = ParseCsvLine(line);
            if (parts.Count < 13) continue;

            // CSV: CommonName,RockFamily,Species,Variety,Alias,ScientificName,MaterialType,MohsHardnessMin,MohsHardnessMax,TumblingDifficulty,RecommendedGritSequence,SpecialConsiderations,Notes
            var commonName = parts[0];
            var rockFamily = parts[1];
            var species = parts[2];
            var variety = parts[3];
            var alias = parts[4];
            var scientificName = parts[5];
            var materialTypeStr = parts[6];
            var mohsMinStr = parts[7];
            var mohsMaxStr = parts[8];
            var difficultyStr = parts[9];
            var gritSequence = parts[10];
            var specialConsiderations = parts[11];
            var notes = parts[12];

            // Parse MaterialType
            var materialType = materialTypeStr.ToLowerInvariant() switch
            {
                "mineral" or "mineral/gemstone" => SpecimenMaterialType.Mineral,
                "glass" => SpecimenMaterialType.Glass,
                "fossil" => SpecimenMaterialType.Fossil,
                "other" or "man-made" or "organic" or "abrasive" => SpecimenMaterialType.Other,
                _ => SpecimenMaterialType.Rock
            };

            // Parse TumblingDifficulty
            var difficulty = difficultyStr.ToLowerInvariant() switch
            {
                "intermediate" or "medium" => TumblingDifficulty.Medium,
                "hard" or "advanced" or "expert" or "very hard" => TumblingDifficulty.Hard,
                _ => TumblingDifficulty.Easy
            };

            // Parse Mohs hardness
            decimal? mohsMin = null;
            decimal? mohsMax = null;
            if (decimal.TryParse(mohsMinStr, out var minVal)) mohsMin = minVal;
            if (decimal.TryParse(mohsMaxStr, out var maxVal)) mohsMax = maxVal;

            specimens.Add(new Specimen
            {
                SpecimenId = Guid.NewGuid(),
                CommonName = commonName,
                ScientificName = string.IsNullOrWhiteSpace(scientificName) ? null : scientificName,
                Alias = string.IsNullOrWhiteSpace(alias) ? null : alias,
                RockFamily = string.IsNullOrWhiteSpace(rockFamily) ? null : rockFamily,
                Species = string.IsNullOrWhiteSpace(species) ? null : species,
                Variety = string.IsNullOrWhiteSpace(variety) ? null : variety,
                MaterialType = materialType,
                MohsHardnessMin = mohsMin,
                MohsHardnessMax = mohsMax,
                TumblingDifficulty = difficulty,
                RecommendedGritSequence = string.IsNullOrWhiteSpace(gritSequence) ? null : gritSequence,
                SpecialConsiderations = string.IsNullOrWhiteSpace(specialConsiderations) ? null : specialConsiderations,
                Notes = string.IsNullOrWhiteSpace(notes) ? null : notes,
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            });
        }

        _logger.LogInformation("Loaded {Count} specimens from CSV", specimens.Count);
        return specimens;
    }

    private List<Material> GetMaterialSeedData()
    {
        var now = DateTime.UtcNow;
        var materials = new List<Material>();

        var csvPath = GetCsvPath("materials-seed.csv");
        if (!File.Exists(csvPath))
        {
            _logger.LogWarning("Materials CSV not found at {Path}, skipping", csvPath);
            return materials;
        }

        var lines = File.ReadAllLines(csvPath);
        var isFirstDataLine = true;
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
                continue;

            if (isFirstDataLine)
            {
                isFirstDataLine = false;
                continue;
            }

            var parts = ParseCsvLine(line);
            if (parts.Count < 9) continue;

            // CSV: Category,MaterialType,MaterialSize,CommonName,UsageType,MeshSize,SortOrder,IsCleaning,Notes
            var categoryStr = parts[0];
            var materialType = parts[1];
            var materialSize = parts[2];
            var commonName = parts[3];
            var usageTypeStr = parts[4];
            var meshSizeStr = parts[5];
            var sortOrderStr = parts[6];
            var isCleaningStr = parts[7];
            var notes = parts[8];

            // Parse Category (Polish -> Abrasive per CSV comment)
            var category = categoryStr.ToLowerInvariant() switch
            {
                "additive" => MaterialCategory.Additive,
                "media" => MaterialCategory.Media,
                "cleaning" => MaterialCategory.Cleaning,
                _ => MaterialCategory.Abrasive // Abrasive and Polish both map to Abrasive
            };

            // Parse UsageType (per CSV comments)
            UsageType? usageType = usageTypeStr.ToLowerInvariant() switch
            {
                "coarse" => UsageType.Coarse,
                "medium" => UsageType.Medium,
                "fine" => UsageType.Fine,
                "pre-polish" => UsageType.PrePolish,
                "polish" or "burnish" or "ultra polish" => UsageType.Polish,
                "cleaning" => UsageType.Cleaning,
                _ => null // "Filler", "All", etc. -> null
            };

            // Parse numeric fields
            int.TryParse(meshSizeStr, out var meshSize);
            int.TryParse(sortOrderStr, out var sortOrder);
            bool.TryParse(isCleaningStr, out var isCleaning);

            materials.Add(new Material
            {
                MaterialId = Guid.NewGuid(),
                CommonName = commonName,
                Category = category,
                MaterialType = string.IsNullOrWhiteSpace(materialType) ? null : materialType,
                MaterialSize = string.IsNullOrWhiteSpace(materialSize) ? null : materialSize,
                UsageType = usageType,
                MeshSize = meshSize,
                SortOrder = sortOrder,
                IsCleaning = isCleaning,
                Notes = string.IsNullOrWhiteSpace(notes) ? null : notes,
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            });
        }

        _logger.LogInformation("Loaded {Count} materials from CSV", materials.Count);
        return materials;
    }

    private async Task SeedTumblerModelsAsync()
    {
        if (await _context.TumblerModels.AnyAsync())
        {
            _logger.LogInformation("Tumbler models already seeded, skipping");
            return;
        }

        var models = GetTumblerModelSeedData();
        _context.TumblerModels.AddRange(models);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Seeded {Count} tumbler models", models.Count);
    }

    private List<TumblerModel> GetTumblerModelSeedData()
    {
        var now = DateTime.UtcNow;
        var models = new List<TumblerModel>();

        var csvPath = GetCsvPath("tumbler-models-seed.csv");
        if (!File.Exists(csvPath))
        {
            _logger.LogWarning("Tumbler models CSV not found at {Path}, skipping", csvPath);
            return models;
        }

        var lines = File.ReadAllLines(csvPath);
        var isFirstDataLine = true;
        foreach (var line in lines)
        {
            // Skip comments and empty lines
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
                continue;

            // Skip header row
            if (isFirstDataLine)
            {
                isFirstDataLine = false;
                continue;
            }

            var parts = line.Split(',');
            if (parts.Length < 8)
                continue;

            // Parse CSV: Brand,Model,TumblerType,DefaultCapacityLbs,DefaultBarrelCount,MotorCapacityLbs,IsCustomEntry,SortOrder,Notes
            var brand = parts[0].Trim();
            var model = parts[1].Trim();
            var tumblerTypeStr = parts[2].Trim();
            var defaultCapacityStr = parts[3].Trim();
            var defaultBarrelCountStr = parts[4].Trim();
            var motorCapacityStr = parts[5].Trim();
            var isCustomEntryStr = parts[6].Trim();
            var sortOrderStr = parts[7].Trim();

            // Parse tumbler type
            var tumblerType = tumblerTypeStr.Equals("Vibratory", StringComparison.OrdinalIgnoreCase)
                ? TumblerType.Vibratory
                : TumblerType.Rotary;

            // Parse nullable decimals
            decimal? defaultCapacity = string.IsNullOrEmpty(defaultCapacityStr) ? null : decimal.Parse(defaultCapacityStr);
            decimal? motorCapacity = string.IsNullOrEmpty(motorCapacityStr) ? null : decimal.Parse(motorCapacityStr);

            // Parse other fields
            int.TryParse(defaultBarrelCountStr, out var defaultBarrelCount);
            if (defaultBarrelCount == 0) defaultBarrelCount = 1;

            bool.TryParse(isCustomEntryStr, out var isCustomEntry);
            int.TryParse(sortOrderStr, out var sortOrder);

            models.Add(new TumblerModel
            {
                TumblerModelId = Guid.NewGuid(),
                Brand = brand,
                Model = model,
                TumblerType = tumblerType,
                DefaultCapacityLbs = defaultCapacity,
                DefaultBarrelCount = defaultBarrelCount,
                MotorCapacityLbs = motorCapacity,
                IsCustomEntry = isCustomEntry,
                SortOrder = sortOrder,
                DateCreated = now,
                DateUpdated = now
            });
        }

        _logger.LogInformation("Loaded {Count} tumbler models from CSV", models.Count);
        return models;
    }

    private async Task SeedBarrelNicknamesAsync()
    {
        if (await _context.BarrelNicknames.AnyAsync())
        {
            _logger.LogInformation("Barrel nicknames already seeded, skipping");
            return;
        }

        var nicknames = GetBarrelNicknameSeedData();
        _context.BarrelNicknames.AddRange(nicknames);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Seeded {Count} barrel nicknames", nicknames.Count);
    }

    private List<BarrelNickname> GetBarrelNicknameSeedData()
    {
        var now = DateTime.UtcNow;
        var nicknames = new List<BarrelNickname>();

        var csvPath = GetCsvPath("barrel-nicknames-seed.csv");
        if (!File.Exists(csvPath))
        {
            _logger.LogWarning("Barrel nicknames CSV not found at {Path}, using empty list", csvPath);
            return nicknames;
        }

        var lines = File.ReadAllLines(csvPath);
        var isFirstDataLine = true;
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
                continue;

            if (isFirstDataLine)
            {
                isFirstDataLine = false;
                continue;
            }

            var parts = ParseCsvLine(line);
            if (parts.Count < 2) continue;

            var name = parts[0];
            var category = parts[1];

            nicknames.Add(new BarrelNickname
            {
                BarrelNicknameId = Guid.NewGuid(),
                Name = name,
                Category = category,
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            });
        }

        _logger.LogInformation("Loaded {Count} barrel nicknames from CSV", nicknames.Count);
        return nicknames;
    }
}
