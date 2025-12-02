using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IReferenceDataService
{
    // Specimens (public)
    Task<IEnumerable<SpecimenListDto>> GetSpecimensAsync(SpecimenSearchRequest? search = null);
    Task<SpecimenDetailDto?> GetSpecimenByIdAsync(Guid id);

    // Materials (public)
    Task<IEnumerable<MaterialListDto>> GetMaterialsAsync(MaterialSearchRequest? search = null);
    Task<MaterialDetailDto?> GetMaterialByIdAsync(Guid id);

    // Admin - Specimens
    Task<PaginatedResult<SpecimenListDto>> GetSpecimensPaginatedAsync(
        string? search = null,
        string? materialType = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 20);
    Task<SpecimenDetailDto> CreateSpecimenAsync(CreateSpecimenRequest request);
    Task<SpecimenDetailDto> UpdateSpecimenAsync(Guid id, UpdateSpecimenRequest request);
    Task DeleteSpecimenAsync(Guid id);

    // Admin - Materials
    Task<PaginatedResult<MaterialListDto>> GetMaterialsPaginatedAsync(
        string? search = null,
        string? category = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 20);
    Task<MaterialDetailDto> CreateMaterialAsync(CreateMaterialRequest request);
    Task<MaterialDetailDto> UpdateMaterialAsync(Guid id, UpdateMaterialRequest request);
    Task DeleteMaterialAsync(Guid id);

    // Barrel Nicknames (public)
    Task<IEnumerable<string>> GetBarrelNicknamesAsync();
}
