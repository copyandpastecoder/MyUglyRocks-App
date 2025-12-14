using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class UserSpecimenService : IUserSpecimenService
{
    private readonly DbContext _context;

    public UserSpecimenService(DbContext context)
    {
        _context = context;
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
            var searchLower = search.ToLower();
            query = query.Where(us =>
                us.CommonName.ToLower().Contains(searchLower) ||
                (us.ScientificName != null && us.ScientificName.ToLower().Contains(searchLower)) ||
                (us.Alias != null && us.Alias.ToLower().Contains(searchLower)));
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
            us.DateCreated
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
            BasedOnSpecimenId = request.BasedOnSpecimenId
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
            var searchLower = search.ToLower();

            userQuery = userQuery.Where(us =>
                us.CommonName.ToLower().Contains(searchLower) ||
                (us.ScientificName != null && us.ScientificName.ToLower().Contains(searchLower)) ||
                (us.Alias != null && us.Alias.ToLower().Contains(searchLower)));

            if (includePublic)
            {
                publicQuery = publicQuery.Where(us =>
                    us.CommonName.ToLower().Contains(searchLower) ||
                    (us.ScientificName != null && us.ScientificName.ToLower().Contains(searchLower)) ||
                    (us.Alias != null && us.Alias.ToLower().Contains(searchLower)));
            }

            systemQuery = systemQuery.Where(s =>
                s.CommonName.ToLower().Contains(searchLower) ||
                (s.ScientificName != null && s.ScientificName.ToLower().Contains(searchLower)) ||
                (s.Alias != null && s.Alias.ToLower().Contains(searchLower)));
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
            specimen.DateCreated
        );
    }
}
