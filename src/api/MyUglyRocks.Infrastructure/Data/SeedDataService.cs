using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Infrastructure.Data;

public class SeedDataService
{
    private readonly AppDbContext _context;
    private readonly ILogger<SeedDataService> _logger;
    private static readonly Guid SystemUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid TestUserId = Guid.Parse("00000000-0000-0000-0000-000000000002");

    public SeedDataService(AppDbContext context, ILogger<SeedDataService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAllAsync()
    {
        await EnsureSystemUserAsync();
        await EnsureTestUserAsync();
        await SeedSpecimensAsync();
        await SeedMaterialsAsync();
        await SeedTumblerModelsAsync();
    }

    private async Task EnsureSystemUserAsync()
    {
        if (!await _context.Users.AnyAsync(u => u.Id == SystemUserId))
        {
            _context.Users.Add(new User
            {
                Id = SystemUserId,
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
        if (!await _context.Users.AnyAsync(u => u.Id == TestUserId))
        {
            var now = DateTime.UtcNow;
            _context.Users.Add(new User
            {
                Id = TestUserId,
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
        return
        [
            // Agates
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Agate",
                RockFamily = "Chalcedony",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Very common and forgiving. Good for beginners.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Blue Lace Agate",
                RockFamily = "Chalcedony",
                Variety = "Agate",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Moss Agate",
                RockFamily = "Chalcedony",
                Variety = "Agate",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Crazy Lace Agate",
                RockFamily = "Chalcedony",
                Variety = "Agate",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Lake Superior Agate",
                RockFamily = "Chalcedony",
                Variety = "Agate",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Famous banded patterns. Very popular for tumbling.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },

            // Jaspers
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Jasper",
                RockFamily = "Chalcedony",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Opaque variety of chalcedony. Takes a great polish.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Red Jasper",
                RockFamily = "Chalcedony",
                Variety = "Jasper",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Ocean Jasper",
                RockFamily = "Chalcedony",
                Variety = "Jasper",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Beautiful orb patterns. From Madagascar.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Picture Jasper",
                RockFamily = "Chalcedony",
                Variety = "Jasper",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },

            // Quartz varieties
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Quartz",
                ScientificName = "Silicon Dioxide",
                RockFamily = "Quartz",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 7.0m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Rose Quartz",
                RockFamily = "Quartz",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 7.0m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "May have fractures that affect polish quality.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Smoky Quartz",
                RockFamily = "Quartz",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 7.0m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Amethyst",
                RockFamily = "Quartz",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 7.0m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "60/90, 120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Crystal points may chip. Use ceramic media for protection.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Citrine",
                RockFamily = "Quartz",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 7.0m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "60/90, 120/220, 500, Pre-Polish, Polish",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },

            // Other popular specimens
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Tiger's Eye",
                RockFamily = "Quartz",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Shows beautiful chatoyancy when polished.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Obsidian",
                RockFamily = "Volcanic Glass",
                MaterialType = SpecimenMaterialType.Glass,
                MohsHardnessMin = 5.0m,
                MohsHardnessMax = 5.5m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Softer than quartz. Skip coarse grit. Can chip easily.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Snowflake Obsidian",
                RockFamily = "Volcanic Glass",
                Variety = "Obsidian",
                MaterialType = SpecimenMaterialType.Glass,
                MohsHardnessMin = 5.0m,
                MohsHardnessMax = 5.5m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Has cristobalite inclusions creating snowflake pattern.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Petrified Wood",
                RockFamily = "Silicified Wood",
                MaterialType = SpecimenMaterialType.Fossil,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Shows beautiful wood grain patterns when polished.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Amazonite",
                RockFamily = "Feldspar",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 6.0m,
                MohsHardnessMax = 6.5m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "60/90, 120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Softer than quartz. Don't mix with harder stones.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Labradorite",
                RockFamily = "Feldspar",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 6.0m,
                MohsHardnessMax = 6.5m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "60/90, 120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Shows beautiful iridescent labradorescence when polished.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Moonstone",
                RockFamily = "Feldspar",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 6.0m,
                MohsHardnessMax = 6.5m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Shows adularescence. Handle gently.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Sodalite",
                RockFamily = "Sodalite Group",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 5.5m,
                MohsHardnessMax = 6.0m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Softer mineral. Don't mix with quartz.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Lapis Lazuli",
                RockFamily = "Lazurite",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 5.0m,
                MohsHardnessMax = 5.5m,
                TumblingDifficulty = TumblingDifficulty.Hard,
                RecommendedGritSequence = "220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Soft and porous. Requires extra care. May need sealing.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Malachite",
                RockFamily = "Copper Carbonate",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 3.5m,
                MohsHardnessMax = 4.0m,
                TumblingDifficulty = TumblingDifficulty.Hard,
                RecommendedGritSequence = "220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Very soft. Tumble alone. Dust is toxic - use wet tumbling only.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Turquoise",
                RockFamily = "Phosphate",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 5.0m,
                MohsHardnessMax = 6.0m,
                TumblingDifficulty = TumblingDifficulty.Hard,
                RecommendedGritSequence = "220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Porous material. May need stabilization. Tumble alone.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Carnelian",
                RockFamily = "Chalcedony",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Orange-red variety of chalcedony. Takes excellent polish.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Onyx",
                RockFamily = "Chalcedony",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Banded variety of chalcedony. Excellent for tumbling.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Aventurine",
                RockFamily = "Quartz",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Contains mica or fuchsite inclusions that create sparkle.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Bloodstone",
                RockFamily = "Chalcedony",
                Alias = "Heliotrope",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.5m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Dark green with red spots. Classic tumbling stone.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Unakite",
                RockFamily = "Granite",
                MaterialType = SpecimenMaterialType.Rock,
                MohsHardnessMin = 6.0m,
                MohsHardnessMax = 7.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "60/90, 120/220, 500, Polish",
                SpecialConsiderations = "Pink feldspar and green epidote. May have variable hardness.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Rhodonite",
                RockFamily = "Pyroxenoid",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 5.5m,
                MohsHardnessMax = 6.5m,
                TumblingDifficulty = TumblingDifficulty.Medium,
                RecommendedGritSequence = "60/90, 120/220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Pink with black manganese inclusions. Variable hardness.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Howlite",
                RockFamily = "Borate",
                MaterialType = SpecimenMaterialType.Mineral,
                MohsHardnessMin = 3.5m,
                MohsHardnessMax = 3.5m,
                TumblingDifficulty = TumblingDifficulty.Hard,
                RecommendedGritSequence = "220, 500, Pre-Polish, Polish",
                SpecialConsiderations = "Very soft. Often dyed to imitate turquoise. Tumble alone.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Specimen
            {
                Id = Guid.NewGuid(),
                CommonName = "Sea Glass",
                MaterialType = SpecimenMaterialType.Glass,
                MohsHardnessMin = 5.5m,
                MohsHardnessMax = 6.0m,
                TumblingDifficulty = TumblingDifficulty.Easy,
                RecommendedGritSequence = "120/220, 500, Polish",
                SpecialConsiderations = "Already frosted. Light tumbling to smooth edges.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
        ];
    }

    private List<Material> GetMaterialSeedData()
    {
        var now = DateTime.UtcNow;
        return
        [
            // Abrasives - Silicon Carbide grits
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Silicon Carbide 60/90 Grit",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Silicon Carbide",
                MaterialSize = "60/90 mesh",
                UsageType = UsageType.Coarse,
                MeshSize = 60,
                SortOrder = 1,
                Notes = "Coarse grit for initial shaping. Removes rough edges and shapes stones.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Silicon Carbide 120/220 Grit",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Silicon Carbide",
                MaterialSize = "120/220 mesh",
                UsageType = UsageType.Medium,
                MeshSize = 120,
                SortOrder = 2,
                Notes = "Medium grit for smoothing. Removes scratches from coarse stage.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Silicon Carbide 500 Grit",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Silicon Carbide",
                MaterialSize = "500 mesh",
                UsageType = UsageType.Fine,
                MeshSize = 500,
                SortOrder = 3,
                Notes = "Fine grit for pre-polish smoothing.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Silicon Carbide 600 Grit",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Silicon Carbide",
                MaterialSize = "600 mesh",
                UsageType = UsageType.Fine,
                MeshSize = 600,
                SortOrder = 4,
                Notes = "Alternative fine grit option.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Silicon Carbide 1000 Grit",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Silicon Carbide",
                MaterialSize = "1000 mesh",
                UsageType = UsageType.PrePolish,
                MeshSize = 1000,
                SortOrder = 5,
                Notes = "Pre-polish grit for extra-smooth finish before polishing.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },

            // Aluminum Oxide grits
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Aluminum Oxide 60/90 Grit",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Aluminum Oxide",
                MaterialSize = "60/90 mesh",
                UsageType = UsageType.Coarse,
                MeshSize = 60,
                SortOrder = 10,
                Notes = "Alternative coarse grit. Longer lasting than silicon carbide.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Aluminum Oxide 120/220 Grit",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Aluminum Oxide",
                MaterialSize = "120/220 mesh",
                UsageType = UsageType.Medium,
                MeshSize = 120,
                SortOrder = 11,
                Notes = "Alternative medium grit option.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },

            // Polishes
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Aluminum Oxide Polish",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Aluminum Oxide",
                MaterialSize = "Micro",
                UsageType = UsageType.Polish,
                MeshSize = 0,
                SortOrder = 20,
                Notes = "Standard polish for most stones. Good all-around choice.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Cerium Oxide Polish",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Cerium Oxide",
                MaterialSize = "Micro",
                UsageType = UsageType.Polish,
                MeshSize = 0,
                SortOrder = 21,
                Notes = "Excellent for glass and obsidian. Creates high shine.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Tin Oxide Polish",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Tin Oxide",
                MaterialSize = "Micro",
                UsageType = UsageType.Polish,
                MeshSize = 0,
                SortOrder = 22,
                Notes = "Premium polish for best shine. More expensive.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Chrome Oxide Polish",
                Category = MaterialCategory.Abrasive,
                MaterialType = "Chrome Oxide",
                MaterialSize = "Micro",
                UsageType = UsageType.Polish,
                MeshSize = 0,
                SortOrder = 23,
                Notes = "Green polish. Excellent for jade and softer stones.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },

            // Media
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Ceramic Cylinders",
                Category = MaterialCategory.Media,
                MaterialType = "Ceramic",
                MaterialSize = "Various",
                MeshSize = 0,
                SortOrder = 30,
                Notes = "Tumbling media. Helps cushion and fill barrel for even tumbling.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Ceramic Triangles",
                Category = MaterialCategory.Media,
                MaterialType = "Ceramic",
                MaterialSize = "Various",
                MeshSize = 0,
                SortOrder = 31,
                Notes = "Tumbling media. Gets into corners and crevices.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Plastic Pellets",
                Category = MaterialCategory.Media,
                MaterialType = "Plastic",
                MaterialSize = "Small",
                MeshSize = 0,
                SortOrder = 32,
                Notes = "Used in polish stage. Cushions stones and helps distribute polish.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Corn Cob Media",
                Category = MaterialCategory.Media,
                MaterialType = "Organic",
                MaterialSize = "Granular",
                MeshSize = 0,
                SortOrder = 33,
                Notes = "Used for drying and light burnishing.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Walnut Shell Media",
                Category = MaterialCategory.Media,
                MaterialType = "Organic",
                MaterialSize = "Granular",
                MeshSize = 0,
                SortOrder = 34,
                Notes = "Softer media for delicate stones.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },

            // Cleaning and additives
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Burnishing Soap",
                Category = MaterialCategory.Cleaning,
                MaterialType = "Soap",
                UsageType = UsageType.Cleaning,
                MeshSize = 0,
                SortOrder = 40,
                IsCleaning = true,
                Notes = "Used in burnish stage for final shine. Ivory soap flakes work well.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Borax",
                Category = MaterialCategory.Additive,
                MaterialType = "Chemical",
                MeshSize = 0,
                SortOrder = 41,
                Notes = "Additive to help grit work. Cleans and softens water.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
            new Material
            {
                Id = Guid.NewGuid(),
                CommonName = "Baking Soda",
                Category = MaterialCategory.Additive,
                MaterialType = "Chemical",
                MeshSize = 0,
                SortOrder = 42,
                Notes = "Helps neutralize acids and clean stones.",
                UserCreated = SystemUserId,
                UserUpdated = SystemUserId,
                DateCreated = now,
                DateUpdated = now
            },
        ];
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
        return
        [
            // Lortone - Popular rotary tumblers
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Lortone",
                Model = "3A",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 3,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 3,
                SortOrder = 1,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Lortone",
                Model = "33B",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 3,
                DefaultBarrelCount = 2,
                MotorCapacityLbs = 6,
                SortOrder = 2,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Lortone",
                Model = "45C",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 4,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 4,
                SortOrder = 3,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Lortone",
                Model = "QT-6",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 6,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 6,
                SortOrder = 4,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Lortone",
                Model = "QT-12",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 12,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 12,
                SortOrder = 5,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Lortone",
                Model = "QT-66",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 6,
                DefaultBarrelCount = 2,
                MotorCapacityLbs = 12,
                SortOrder = 6,
                DateCreated = now,
                DateUpdated = now
            },

            // Thumler's Tumbler
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Thumler's",
                Model = "Model A-R1",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 3,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 3,
                SortOrder = 10,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Thumler's",
                Model = "Model A-R2",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 3,
                DefaultBarrelCount = 2,
                MotorCapacityLbs = 6,
                SortOrder = 11,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Thumler's",
                Model = "Model B",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 15,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 15,
                SortOrder = 12,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Thumler's",
                Model = "UV-10",
                TumblerType = TumblerType.Vibratory,
                DefaultCapacityLbs = 10,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 10,
                SortOrder = 13,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Thumler's",
                Model = "UV-18",
                TumblerType = TumblerType.Vibratory,
                DefaultCapacityLbs = 18,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 18,
                SortOrder = 14,
                DateCreated = now,
                DateUpdated = now
            },

            // National Geographic (beginner friendly)
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "National Geographic",
                Model = "Starter Kit",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 1,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 1,
                SortOrder = 20,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "National Geographic",
                Model = "Professional",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 2,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 2,
                SortOrder = 21,
                DateCreated = now,
                DateUpdated = now
            },

            // Harbor Freight / Chicago Electric
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Harbor Freight",
                Model = "Dual Drum",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 3,
                DefaultBarrelCount = 2,
                MotorCapacityLbs = 6,
                SortOrder = 30,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Harbor Freight",
                Model = "Single Drum",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = 3,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 3,
                SortOrder = 31,
                DateCreated = now,
                DateUpdated = now
            },

            // Raytech / Lortone vibratory
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Raytech",
                Model = "TV-5",
                TumblerType = TumblerType.Vibratory,
                DefaultCapacityLbs = 5,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 5,
                SortOrder = 40,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Raytech",
                Model = "TV-10",
                TumblerType = TumblerType.Vibratory,
                DefaultCapacityLbs = 10,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = 10,
                SortOrder = 41,
                DateCreated = now,
                DateUpdated = now
            },

            // MJR Tumblers (custom/DIY brand - editable capacity)
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "MJR Tumblers",
                Model = "Custom Rotary",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = null,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = null,
                IsCustomEntry = true,
                SortOrder = 50,
                DateCreated = now,
                DateUpdated = now
            },

            // Generic options (for users to enter custom)
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Generic",
                Model = "Rotary Tumbler",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = null,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = null,
                IsCustomEntry = true,
                SortOrder = 90,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Generic",
                Model = "Vibratory Tumbler",
                TumblerType = TumblerType.Vibratory,
                DefaultCapacityLbs = null,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = null,
                IsCustomEntry = true,
                SortOrder = 91,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Other",
                Model = "Rotary Tumbler",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = null,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = null,
                IsCustomEntry = true,
                SortOrder = 95,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "Other",
                Model = "Vibratory Tumbler",
                TumblerType = TumblerType.Vibratory,
                DefaultCapacityLbs = null,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = null,
                IsCustomEntry = true,
                SortOrder = 96,
                DateCreated = now,
                DateUpdated = now
            },
            new TumblerModel
            {
                Id = Guid.NewGuid(),
                Brand = "DIY",
                Model = "Custom Build",
                TumblerType = TumblerType.Rotary,
                DefaultCapacityLbs = null,
                DefaultBarrelCount = 1,
                MotorCapacityLbs = null,
                IsCustomEntry = true,
                SortOrder = 98,
                DateCreated = now,
                DateUpdated = now
            },
        ];
    }
}
