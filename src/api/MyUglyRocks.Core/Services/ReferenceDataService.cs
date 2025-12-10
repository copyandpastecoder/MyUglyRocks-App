using Mapster;
using Microsoft.EntityFrameworkCore;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class ReferenceDataService : IReferenceDataService
{
    private readonly DbContext _context;
    private readonly ICacheService _cache;

    private const string SpecimensCacheKey = "specimens:all";
    private const string SpecimenCacheKeyPrefix = "specimens:";
    private const string MaterialsCacheKey = "materials:all";
    private const string MaterialCacheKeyPrefix = "materials:";
    private const string BarrelNicknamesCacheKey = "barrel-nicknames:all";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public ReferenceDataService(DbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<IEnumerable<SpecimenListDto>> GetSpecimensAsync(SpecimenSearchRequest? search = null)
    {
        // Use cache for unfiltered requests
        var hasFilters = search != null && (
            !string.IsNullOrWhiteSpace(search.Query) ||
            !string.IsNullOrWhiteSpace(search.MaterialType) ||
            !string.IsNullOrWhiteSpace(search.Difficulty) ||
            search.MinHardness.HasValue ||
            search.MaxHardness.HasValue);

        if (!hasFilters)
        {
            var cached = await _cache.GetAsync<List<SpecimenListDto>>(SpecimensCacheKey);
            if (cached != null)
                return cached;
        }

        var query = _context.Set<Specimen>()
            .Where(s => s.IsActive)
            .AsQueryable();

        if (search != null)
        {
            if (!string.IsNullOrWhiteSpace(search.Query))
            {
                var searchTerm = search.Query.ToLower();
                query = query.Where(s =>
                    s.CommonName.ToLower().Contains(searchTerm) ||
                    (s.Alias != null && s.Alias.ToLower().Contains(searchTerm)) ||
                    (s.RockFamily != null && s.RockFamily.ToLower().Contains(searchTerm)) ||
                    (s.Variety != null && s.Variety.ToLower().Contains(searchTerm)));
            }

            if (!string.IsNullOrWhiteSpace(search.MaterialType) &&
                Enum.TryParse<SpecimenMaterialType>(search.MaterialType, true, out var materialType))
            {
                query = query.Where(s => s.MaterialType == materialType);
            }

            if (!string.IsNullOrWhiteSpace(search.Difficulty) &&
                Enum.TryParse<TumblingDifficulty>(search.Difficulty, true, out var difficulty))
            {
                query = query.Where(s => s.TumblingDifficulty == difficulty);
            }

            if (search.MinHardness.HasValue)
            {
                query = query.Where(s => s.MohsHardnessMin >= search.MinHardness.Value ||
                                         s.MohsHardnessMax >= search.MinHardness.Value);
            }

            if (search.MaxHardness.HasValue)
            {
                query = query.Where(s => s.MohsHardnessMin <= search.MaxHardness.Value ||
                                         s.MohsHardnessMax <= search.MaxHardness.Value);
            }
        }

        var specimens = await query
            .OrderBy(s => s.CommonName)
            .ToListAsync();

        var result = specimens.Adapt<List<SpecimenListDto>>();

        // Cache unfiltered results
        if (!hasFilters)
        {
            await _cache.SetAsync(SpecimensCacheKey, result, CacheDuration);
        }

        return result;
    }

    public async Task<SpecimenDetailDto?> GetSpecimenByIdAsync(Guid specimenId)
    {
        var cacheKey = $"{SpecimenCacheKeyPrefix}{specimenId}";
        var cached = await _cache.GetAsync<SpecimenDetailDto>(cacheKey);
        if (cached != null)
            return cached;

        var specimen = await _context.Set<Specimen>()
            .FirstOrDefaultAsync(s => s.SpecimenId == specimenId && s.IsActive);

        if (specimen == null)
            return null;

        var result = specimen.Adapt<SpecimenDetailDto>();
        await _cache.SetAsync(cacheKey, result, CacheDuration);
        return result;
    }

    public async Task<IEnumerable<MaterialListDto>> GetMaterialsAsync(MaterialSearchRequest? search = null)
    {
        // Use cache for unfiltered requests
        var hasFilters = search != null && (
            !string.IsNullOrWhiteSpace(search.Query) ||
            !string.IsNullOrWhiteSpace(search.Category) ||
            !string.IsNullOrWhiteSpace(search.UsageType));

        if (!hasFilters)
        {
            var cached = await _cache.GetAsync<List<MaterialListDto>>(MaterialsCacheKey);
            if (cached != null)
                return cached;
        }

        var query = _context.Set<Material>()
            .Where(m => m.IsActive)
            .AsQueryable();

        if (search != null)
        {
            if (!string.IsNullOrWhiteSpace(search.Query))
            {
                var searchTerm = search.Query.ToLower();
                query = query.Where(m =>
                    m.CommonName.ToLower().Contains(searchTerm) ||
                    (m.MaterialType != null && m.MaterialType.ToLower().Contains(searchTerm)));
            }

            if (!string.IsNullOrWhiteSpace(search.Category) &&
                Enum.TryParse<MaterialCategory>(search.Category, true, out var category))
            {
                query = query.Where(m => m.Category == category);
            }

            if (!string.IsNullOrWhiteSpace(search.UsageType) &&
                Enum.TryParse<UsageType>(search.UsageType, true, out var usageType))
            {
                query = query.Where(m => m.UsageType == usageType);
            }
        }

        var materials = await query
            .OrderBy(m => m.SortOrder)
            .ThenBy(m => m.CommonName)
            .ToListAsync();

        var result = materials.Adapt<List<MaterialListDto>>();

        // Cache unfiltered results
        if (!hasFilters)
        {
            await _cache.SetAsync(MaterialsCacheKey, result, CacheDuration);
        }

        return result;
    }

    public async Task<MaterialDetailDto?> GetMaterialByIdAsync(Guid materialId)
    {
        var cacheKey = $"{MaterialCacheKeyPrefix}{materialId}";
        var cached = await _cache.GetAsync<MaterialDetailDto>(cacheKey);
        if (cached != null)
            return cached;

        var material = await _context.Set<Material>()
            .FirstOrDefaultAsync(m => m.MaterialId == materialId && m.IsActive);

        if (material == null)
            return null;

        var result = material.Adapt<MaterialDetailDto>();
        await _cache.SetAsync(cacheKey, result, CacheDuration);
        return result;
    }

    #region Admin - Specimens

    public async Task<PaginatedResult<SpecimenListDto>> GetSpecimensPaginatedAsync(
        string? search = null,
        string? materialType = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.Set<Specimen>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.ToLower();
            query = query.Where(s =>
                s.CommonName.ToLower().Contains(searchTerm) ||
                (s.Alias != null && s.Alias.ToLower().Contains(searchTerm)) ||
                (s.RockFamily != null && s.RockFamily.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrWhiteSpace(materialType) &&
            Enum.TryParse<SpecimenMaterialType>(materialType, true, out var matType))
        {
            query = query.Where(s => s.MaterialType == matType);
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(s => s.CommonName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<SpecimenListDto>(
            items.Adapt<IList<SpecimenListDto>>(),
            totalCount,
            page,
            pageSize,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<SpecimenDetailDto> CreateSpecimenAsync(CreateSpecimenRequest request)
    {
        var specimen = new Specimen
        {
            CommonName = request.CommonName,
            ScientificName = request.ScientificName,
            Alias = request.Alias,
            RockFamily = request.RockFamily,
            Species = request.Species,
            Variety = request.Variety,
            MaterialType = Enum.TryParse<SpecimenMaterialType>(request.MaterialType, true, out var matType)
                ? matType
                : SpecimenMaterialType.Rock,
            MohsHardnessMin = request.MohsHardnessMin,
            MohsHardnessMax = request.MohsHardnessMax,
            TumblingDifficulty = !string.IsNullOrEmpty(request.TumblingDifficulty) &&
                Enum.TryParse<TumblingDifficulty>(request.TumblingDifficulty, true, out var difficulty)
                ? difficulty
                : null,
            RecommendedGritSequence = request.RecommendedGritSequence,
            SpecialConsiderations = request.SpecialConsiderations,
            Notes = request.Notes,
            IsActive = true
        };

        _context.Set<Specimen>().Add(specimen);
        await _context.SaveChangesAsync();

        // Invalidate specimens cache
        await _cache.RemoveAsync(SpecimensCacheKey);

        return specimen.Adapt<SpecimenDetailDto>();
    }

    public async Task<SpecimenDetailDto> UpdateSpecimenAsync(Guid specimenId, UpdateSpecimenRequest request)
    {
        var specimen = await _context.Set<Specimen>().FindAsync(specimenId)
            ?? throw new InvalidOperationException("Specimen not found");

        specimen.CommonName = request.CommonName;
        specimen.ScientificName = request.ScientificName;
        specimen.Alias = request.Alias;
        specimen.RockFamily = request.RockFamily;
        specimen.Species = request.Species;
        specimen.Variety = request.Variety;
        specimen.MaterialType = Enum.TryParse<SpecimenMaterialType>(request.MaterialType, true, out var matType)
            ? matType
            : SpecimenMaterialType.Rock;
        specimen.MohsHardnessMin = request.MohsHardnessMin;
        specimen.MohsHardnessMax = request.MohsHardnessMax;
        specimen.TumblingDifficulty = !string.IsNullOrEmpty(request.TumblingDifficulty) &&
            Enum.TryParse<TumblingDifficulty>(request.TumblingDifficulty, true, out var difficulty)
            ? difficulty
            : null;
        specimen.RecommendedGritSequence = request.RecommendedGritSequence;
        specimen.SpecialConsiderations = request.SpecialConsiderations;
        specimen.Notes = request.Notes;
        specimen.IsActive = request.IsActive;
        specimen.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Invalidate specimens cache
        await _cache.RemoveAsync(SpecimensCacheKey);
        await _cache.RemoveAsync($"{SpecimenCacheKeyPrefix}{specimenId}");

        return specimen.Adapt<SpecimenDetailDto>();
    }

    public async Task DeleteSpecimenAsync(Guid specimenId)
    {
        var specimen = await _context.Set<Specimen>().FindAsync(specimenId)
            ?? throw new InvalidOperationException("Specimen not found");

        specimen.IsActive = false;
        specimen.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Invalidate specimens cache
        await _cache.RemoveAsync(SpecimensCacheKey);
        await _cache.RemoveAsync($"{SpecimenCacheKeyPrefix}{specimenId}");
    }

    #endregion

    #region Admin - Materials

    public async Task<PaginatedResult<MaterialListDto>> GetMaterialsPaginatedAsync(
        string? search = null,
        string? category = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.Set<Material>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.ToLower();
            query = query.Where(m =>
                m.CommonName.ToLower().Contains(searchTerm) ||
                (m.MaterialType != null && m.MaterialType.ToLower().Contains(searchTerm)));
        }

        if (!string.IsNullOrWhiteSpace(category) &&
            Enum.TryParse<MaterialCategory>(category, true, out var cat))
        {
            query = query.Where(m => m.Category == cat);
        }

        if (isActive.HasValue)
        {
            query = query.Where(m => m.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(m => m.SortOrder)
            .ThenBy(m => m.CommonName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<MaterialListDto>(
            items.Adapt<IList<MaterialListDto>>(),
            totalCount,
            page,
            pageSize,
            (int)Math.Ceiling(totalCount / (double)pageSize)
        );
    }

    public async Task<MaterialDetailDto> CreateMaterialAsync(CreateMaterialRequest request)
    {
        var material = new Material
        {
            CommonName = request.CommonName,
            Category = Enum.TryParse<MaterialCategory>(request.Category, true, out var cat)
                ? cat
                : MaterialCategory.Abrasive,
            MaterialType = request.MaterialType,
            MaterialSize = request.MaterialSize,
            UsageType = !string.IsNullOrEmpty(request.UsageType) &&
                Enum.TryParse<UsageType>(request.UsageType, true, out var usage)
                ? usage
                : null,
            MeshSize = request.MeshSize,
            SortOrder = request.SortOrder,
            IsCleaning = request.IsCleaning,
            Notes = request.Notes,
            IsActive = true
        };

        _context.Set<Material>().Add(material);
        await _context.SaveChangesAsync();

        // Invalidate materials cache
        await _cache.RemoveAsync(MaterialsCacheKey);

        return material.Adapt<MaterialDetailDto>();
    }

    public async Task<MaterialDetailDto> UpdateMaterialAsync(Guid materialId, UpdateMaterialRequest request)
    {
        var material = await _context.Set<Material>().FindAsync(materialId)
            ?? throw new InvalidOperationException("Material not found");

        material.CommonName = request.CommonName;
        material.Category = Enum.TryParse<MaterialCategory>(request.Category, true, out var cat)
            ? cat
            : MaterialCategory.Abrasive;
        material.MaterialType = request.MaterialType;
        material.MaterialSize = request.MaterialSize;
        material.UsageType = !string.IsNullOrEmpty(request.UsageType) &&
            Enum.TryParse<UsageType>(request.UsageType, true, out var usage)
            ? usage
            : null;
        material.MeshSize = request.MeshSize;
        material.SortOrder = request.SortOrder;
        material.IsCleaning = request.IsCleaning;
        material.Notes = request.Notes;
        material.IsActive = request.IsActive;
        material.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Invalidate materials cache
        await _cache.RemoveAsync(MaterialsCacheKey);
        await _cache.RemoveAsync($"{MaterialCacheKeyPrefix}{materialId}");

        return material.Adapt<MaterialDetailDto>();
    }

    public async Task DeleteMaterialAsync(Guid materialId)
    {
        var material = await _context.Set<Material>().FindAsync(materialId)
            ?? throw new InvalidOperationException("Material not found");

        material.IsActive = false;
        material.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Invalidate materials cache
        await _cache.RemoveAsync(MaterialsCacheKey);
        await _cache.RemoveAsync($"{MaterialCacheKeyPrefix}{materialId}");
    }

    #endregion

    #region Barrel Nicknames

    public async Task<IEnumerable<string>> GetBarrelNicknamesAsync()
    {
        var cached = await _cache.GetAsync<List<string>>(BarrelNicknamesCacheKey);
        if (cached != null)
            return cached;

        var nicknames = await _context.Set<BarrelNickname>()
            .Where(n => n.IsActive)
            .Select(n => n.Name)
            .OrderBy(n => n)
            .ToListAsync();

        await _cache.SetAsync(BarrelNicknamesCacheKey, nicknames, CacheDuration);
        return nicknames;
    }

    #endregion
}
