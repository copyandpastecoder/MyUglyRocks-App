using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IUserSpecimenService
{
    Task<IEnumerable<UserSpecimenListDto>> GetUserSpecimensAsync(
        Guid userId,
        string? search = null,
        string? materialType = null,
        string sortBy = "commonName",
        string sortOrder = "asc",
        int skip = 0,
        int take = 20,
        CancellationToken cancellationToken = default);

    Task<UserSpecimenDto?> GetUserSpecimenAsync(Guid userSpecimenId, Guid userId, CancellationToken cancellationToken = default);

    Task<UserSpecimenDto> CreateUserSpecimenAsync(Guid userId, CreateUserSpecimenRequest request, CancellationToken cancellationToken = default);

    Task<UserSpecimenDto?> UpdateUserSpecimenAsync(Guid userSpecimenId, Guid userId, UpdateUserSpecimenRequest request, CancellationToken cancellationToken = default);

    Task<bool> DeleteUserSpecimenAsync(Guid userSpecimenId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Combined search for system and user specimens - for specimen picker dropdowns
    /// </summary>
    Task<IEnumerable<SpecimenOptionDto>> SearchAllSpecimensAsync(
        Guid userId,
        string? search = null,
        bool includePublic = true,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default);
}
