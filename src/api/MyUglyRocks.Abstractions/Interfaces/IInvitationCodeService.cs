using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IInvitationCodeService
{
    /// <summary>
    /// Generates one or more invitation codes (admin only).
    /// </summary>
    Task<List<InvitationCodeDto>> GenerateCodesAsync(
        CreateInvitationCodeRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all invitation codes with optional filtering and pagination (admin only).
    /// </summary>
    Task<PaginatedInvitationCodesResponse> GetCodesAsync(
        int page = 1,
        int pageSize = 20,
        string? status = null, // "unused", "used", "expired", "revoked"
        string? search = null, // Search by code
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific invitation code by ID (admin only).
    /// </summary>
    Task<InvitationCodeDto?> GetCodeByIdAsync(Guid codeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates an invitation code for registration.
    /// Returns validation result with error message if invalid.
    /// </summary>
    Task<InvitationCodeValidationResult> ValidateCodeAsync(
        string code,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks an invitation code as used and associates it with a user.
    /// Throws exception if code is invalid or already used.
    /// </summary>
    Task UseCodeAsync(
        string code,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes an invitation code (prevents further use).
    /// </summary>
    Task RevokeCodeAsync(
        Guid codeId,
        Guid revokedByUserId,
        string reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets invitation statistics for admin dashboard.
    /// </summary>
    Task<InvitationStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
}
