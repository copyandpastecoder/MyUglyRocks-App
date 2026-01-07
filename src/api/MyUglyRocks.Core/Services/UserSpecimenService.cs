using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class UserSpecimenService : IUserSpecimenService
{
    private readonly DbContext _context;
    private readonly IGeminiService _geminiService;
    private readonly ILogger<UserSpecimenService> _logger;

    public UserSpecimenService(
        DbContext context,
        IGeminiService geminiService,
        ILogger<UserSpecimenService> logger)
    {
        _context = context;
        _geminiService = geminiService;
        _logger = logger;
    }

    private DbSet<UserSpecimen> UserSpecimens => _context.Set<UserSpecimen>();
    private DbSet<Specimen> Specimens => _context.Set<Specimen>();

    public async Task<IEnumerable<UserSpecimenListDto>> GetUserSpecimensAsync(
        Guid userId,
        string? search = null,
        string? materialType = null,
        string sortBy = "commonName",
        string sortOrder = "asc",
        int skip = 0,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        var query = UserSpecimens.Where(us => us.UserId == userId);

        if (!string.IsNullOrEmpty(search))
        {
            // Split query into words and require ALL words to match (AND logic)
            // Example: "red jasper" finds items containing BOTH "red" AND "jasper"
            var searchTerms = search.ToLower()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var term in searchTerms)
            {
                var searchTerm = term; // Capture for closure
                query = query.Where(us =>
                    us.CommonName.ToLower().Contains(searchTerm) ||
                    (us.ScientificName != null && us.ScientificName.ToLower().Contains(searchTerm)) ||
                    (us.Alias != null && us.Alias.ToLower().Contains(searchTerm)));
            }
        }

        if (!string.IsNullOrEmpty(materialType) && Enum.TryParse<SpecimenMaterialType>(materialType, true, out var matType))
        {
            query = query.Where(us => us.MaterialType == matType);
        }

        query = sortBy.ToLower() switch
        {
            "datecreated" => sortOrder.ToLower() == "asc" ? query.OrderBy(us => us.DateCreated) : query.OrderByDescending(us => us.DateCreated),
            _ => sortOrder.ToLower() == "asc" ? query.OrderBy(us => us.CommonName) : query.OrderByDescending(us => us.CommonName)
        };

        var items = await query
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);

        return items.Select(us => new UserSpecimenListDto(
            us.UserSpecimenId,
            us.CommonName,
            us.ScientificName,
            us.MaterialType.ToString(),
            us.TumblingDifficulty?.ToString(),
            us.IsPublic,
            us.DateCreated,
            us.AiConfidenceScore,
            us.AiIsKnownSpecimen
        )).ToList();
    }

    public async Task<UserSpecimenDto?> GetUserSpecimenAsync(Guid userSpecimenId, Guid userId, CancellationToken cancellationToken = default)
    {
        var specimen = await UserSpecimens
            .FirstOrDefaultAsync(us => us.UserSpecimenId == userSpecimenId && us.UserId == userId, cancellationToken);

        return specimen == null ? null : MapToDto(specimen);
    }

    public async Task<UserSpecimenDto> CreateUserSpecimenAsync(Guid userId, CreateUserSpecimenRequest request, CancellationToken cancellationToken = default)
    {
        var specimen = new UserSpecimen
        {
            UserId = userId,
            CommonName = request.CommonName,
            ScientificName = request.ScientificName,
            Alias = request.Alias,
            RockFamily = request.RockFamily,
            Species = request.Species,
            Variety = request.Variety,
            MaterialType = Enum.Parse<SpecimenMaterialType>(request.MaterialType, true),
            MohsHardnessMin = request.MohsHardnessMin,
            MohsHardnessMax = request.MohsHardnessMax,
            TumblingDifficulty = string.IsNullOrEmpty(request.TumblingDifficulty) ? null : Enum.Parse<TumblingDifficulty>(request.TumblingDifficulty, true),
            RecommendedGritSequence = request.RecommendedGritSequence,
            SpecialConsiderations = request.SpecialConsiderations,
            Notes = request.Notes,
            IsPublic = request.IsPublic,
            BasedOnSpecimenId = request.BasedOnSpecimenId,
            AiConfidenceScore = request.AiConfidenceScore,
            AiIsKnownSpecimen = request.AiIsKnownSpecimen
        };

        UserSpecimens.Add(specimen);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(specimen);
    }

    public async Task<UserSpecimenDto?> UpdateUserSpecimenAsync(Guid userSpecimenId, Guid userId, UpdateUserSpecimenRequest request, CancellationToken cancellationToken = default)
    {
        var specimen = await UserSpecimens
            .FirstOrDefaultAsync(us => us.UserSpecimenId == userSpecimenId && us.UserId == userId, cancellationToken);

        if (specimen == null)
            return null;

        specimen.CommonName = request.CommonName;
        specimen.ScientificName = request.ScientificName;
        specimen.Alias = request.Alias;
        specimen.RockFamily = request.RockFamily;
        specimen.Species = request.Species;
        specimen.Variety = request.Variety;
        specimen.MaterialType = Enum.Parse<SpecimenMaterialType>(request.MaterialType, true);
        specimen.MohsHardnessMin = request.MohsHardnessMin;
        specimen.MohsHardnessMax = request.MohsHardnessMax;
        specimen.TumblingDifficulty = string.IsNullOrEmpty(request.TumblingDifficulty) ? null : Enum.Parse<TumblingDifficulty>(request.TumblingDifficulty, true);
        specimen.RecommendedGritSequence = request.RecommendedGritSequence;
        specimen.SpecialConsiderations = request.SpecialConsiderations;
        specimen.Notes = request.Notes;
        specimen.IsPublic = request.IsPublic;
        specimen.AiConfidenceScore = request.AiConfidenceScore;
        specimen.AiIsKnownSpecimen = request.AiIsKnownSpecimen;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(specimen);
    }

    public async Task<bool> DeleteUserSpecimenAsync(Guid userSpecimenId, Guid userId, CancellationToken cancellationToken = default)
    {
        var specimen = await UserSpecimens
            .FirstOrDefaultAsync(us => us.UserSpecimenId == userSpecimenId && us.UserId == userId, cancellationToken);

        if (specimen == null)
            return false;

        // Soft delete - handled by SaveChangesAsync override
        UserSpecimens.Remove(specimen);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<SpecimenOptionDto>> SearchAllSpecimensAsync(
        Guid userId,
        string? search = null,
        bool includePublic = true,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        // Get user's own specimens
        var userQuery = UserSpecimens.Where(us => us.UserId == userId);

        // Get public specimens from other users (if enabled)
        var publicQuery = includePublic
            ? UserSpecimens.Where(us => us.UserId != userId && us.IsPublic)
            : Enumerable.Empty<UserSpecimen>().AsQueryable();

        // Get system specimens
        var systemQuery = Specimens.Where(s => s.IsActive);

        if (!string.IsNullOrEmpty(search))
        {
            // Split query into words and require ALL words to match (AND logic)
            // Example: "red jasper" finds items containing BOTH "red" AND "jasper"
            var searchTerms = search.ToLower()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var term in searchTerms)
            {
                var searchTerm = term; // Capture for closure
                userQuery = userQuery.Where(us =>
                    us.CommonName.ToLower().Contains(searchTerm) ||
                    (us.ScientificName != null && us.ScientificName.ToLower().Contains(searchTerm)) ||
                    (us.Alias != null && us.Alias.ToLower().Contains(searchTerm)));

                if (includePublic)
                {
                    publicQuery = publicQuery.Where(us =>
                        us.CommonName.ToLower().Contains(searchTerm) ||
                        (us.ScientificName != null && us.ScientificName.ToLower().Contains(searchTerm)) ||
                        (us.Alias != null && us.Alias.ToLower().Contains(searchTerm)));
                }

                systemQuery = systemQuery.Where(s =>
                    s.CommonName.ToLower().Contains(searchTerm) ||
                    (s.ScientificName != null && s.ScientificName.ToLower().Contains(searchTerm)) ||
                    (s.Alias != null && s.Alias.ToLower().Contains(searchTerm)));
            }
        }

        var userSpecimens = await userQuery
            .OrderBy(us => us.CommonName)
            .ToListAsync(cancellationToken);

        var publicSpecimens = includePublic
            ? await publicQuery.OrderBy(us => us.CommonName).ToListAsync(cancellationToken)
            : new List<UserSpecimen>();

        var systemSpecimens = await systemQuery
            .OrderBy(s => s.CommonName)
            .ToListAsync(cancellationToken);

        // Combine results - user specimens first, then system specimens
        var results = new List<SpecimenOptionDto>();

        // User's own specimens
        results.AddRange(userSpecimens.Select(us => new SpecimenOptionDto(
            us.UserSpecimenId,
            us.CommonName,
            us.ScientificName,
            us.Alias,
            us.MaterialType.ToString(),
            us.TumblingDifficulty?.ToString(),
            us.MohsHardnessMax,
            "user",
            true,
            us.BasedOnSpecimenId
        )));

        // System specimens
        results.AddRange(systemSpecimens.Select(s => new SpecimenOptionDto(
            s.SpecimenId,
            s.CommonName,
            s.ScientificName,
            s.Alias,
            s.MaterialType.ToString(),
            s.TumblingDifficulty?.ToString(),
            s.MohsHardnessMax,
            "system",
            false,
            null
        )));

        // Public specimens from other users (at the end)
        results.AddRange(publicSpecimens.Select(us => new SpecimenOptionDto(
            us.UserSpecimenId,
            us.CommonName,
            us.ScientificName,
            us.Alias,
            us.MaterialType.ToString(),
            us.TumblingDifficulty?.ToString(),
            us.MohsHardnessMax,
            "user",
            false,
            us.BasedOnSpecimenId
        )));

        return results.Skip(skip).Take(take);
    }

    private static UserSpecimenDto MapToDto(UserSpecimen specimen)
    {
        return new UserSpecimenDto(
            specimen.UserSpecimenId,
            specimen.UserId,
            specimen.CommonName,
            specimen.ScientificName,
            specimen.Alias,
            specimen.RockFamily,
            specimen.Species,
            specimen.Variety,
            specimen.MaterialType.ToString(),
            specimen.MohsHardnessMin,
            specimen.MohsHardnessMax,
            specimen.TumblingDifficulty?.ToString(),
            specimen.RecommendedGritSequence,
            specimen.SpecialConsiderations,
            specimen.Notes,
            specimen.IsPublic,
            specimen.BasedOnSpecimenId,
            specimen.DateCreated,
            specimen.AiConfidenceScore,
            specimen.AiIsKnownSpecimen
        );
    }

    public async Task<SpecimenLookupAndCreateResponse> LookupAndCreateSpecimenIfHighConfidenceAsync(
        Guid userId,
        SpecimenLookupRequest request,
        CancellationToken cancellationToken = default)
    {
        // Perform AI lookup
        var lookupResult = await _geminiService.LookupSpecimenAsync(request, cancellationToken);

        if (!lookupResult.Success || lookupResult.Data == null)
        {
            return new SpecimenLookupAndCreateResponse(
                lookupResult.Success,
                lookupResult.Error,
                lookupResult.Data,
                null);
        }

        var data = lookupResult.Data;

        // Check if confidence is high enough (>= 85%)
        if (data.ConfidenceScore >= 85)
        {
            // Check if specimen already exists in system catalog
            var existingSpecimen = await Specimens
                .FirstOrDefaultAsync(s =>
                    s.CommonName.ToLower() == data.CommonName.ToLower() &&
                    s.IsActive,
                    cancellationToken);

            if (existingSpecimen != null)
            {
                _logger.LogInformation(
                    "High-confidence specimen lookup matched existing specimen: {CommonName} (ID: {SpecimenId})",
                    data.CommonName, existingSpecimen.SpecimenId);

                return new SpecimenLookupAndCreateResponse(
                    true,
                    null,
                    data,
                    existingSpecimen.SpecimenId);
            }

            // Create new specimen in system catalog
            var materialType = Enum.TryParse<SpecimenMaterialType>(data.MaterialType, true, out var parsedMaterialType)
                ? parsedMaterialType
                : SpecimenMaterialType.Other;

            TumblingDifficulty? tumblingDifficulty = null;
            if (!string.IsNullOrEmpty(data.TumblingDifficulty))
            {
                if (Enum.TryParse<TumblingDifficulty>(data.TumblingDifficulty, true, out var parsedDifficulty))
                {
                    tumblingDifficulty = parsedDifficulty;
                }
            }

            var newSpecimen = new Specimen
            {
                SpecimenId = Guid.NewGuid(),
                CommonName = data.CommonName,
                ScientificName = data.ScientificName,
                Alias = data.Alias,
                RockFamily = data.RockFamily,
                Species = data.Species,
                Variety = data.Variety,
                MaterialType = materialType,
                MohsHardnessMin = data.MohsHardnessMin,
                MohsHardnessMax = data.MohsHardnessMax,
                TumblingDifficulty = tumblingDifficulty,
                RecommendedGritSequence = data.RecommendedGritSequence,
                SpecialConsiderations = data.SpecialConsiderations,
                Notes = $"AI-generated via high-confidence lookup (Score: {data.ConfidenceScore}%) by user {userId}",
                IsActive = true,
                UserCreated = userId,
                UserUpdated = userId,
                DateCreated = DateTime.UtcNow,
                DateUpdated = DateTime.UtcNow
            };

            Specimens.Add(newSpecimen);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Created new system specimen from high-confidence AI lookup: {CommonName} (ID: {SpecimenId}, Confidence: {Confidence}%)",
                newSpecimen.CommonName, newSpecimen.SpecimenId, data.ConfidenceScore);

            return new SpecimenLookupAndCreateResponse(
                true,
                null,
                data,
                newSpecimen.SpecimenId);
        }

        // Confidence < 85%, return lookup data without creating specimen
        _logger.LogInformation(
            "Specimen lookup below confidence threshold: {CommonName} (Confidence: {Confidence}%)",
            data.CommonName, data.ConfidenceScore);

        return new SpecimenLookupAndCreateResponse(
            true,
            null,
            data,
            null);
    }
}
