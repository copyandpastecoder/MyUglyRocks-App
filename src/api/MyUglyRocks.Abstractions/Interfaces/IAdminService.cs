using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IAdminService
{
    // Dashboard Stats
    Task<AdminStatsDto> GetStatsAsync();

    // Comment Reports
    Task<PaginatedResult<CommentReportListDto>> GetReportsAsync(
        string? status = null,
        int page = 1,
        int pageSize = 20);

    Task<CommentReportDto?> GetReportByIdAsync(Guid reportId);

    Task<CommentReportDto> ResolveReportAsync(
        Guid reportId,
        Guid resolvedByUserId,
        ResolveReportRequest request);

    // Comments (Admin)
    Task DeleteCommentAsync(Guid commentId, Guid deletedByUserId);

    // User Management
    Task<PaginatedResult<AdminUserListDto>> GetUsersAsync(
        string? search = null,
        string? role = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 20);

    Task<AdminUserDto?> GetUserByIdAsync(Guid userId);

    /// <summary>
    /// Creates a new user with the given email. The user must use "Forgot Password" to set their password.
    /// </summary>
    Task<AdminUserDto> CreateUserAsync(CreateUserRequest request);

    Task<AdminUserDto> ChangeUserRoleAsync(
        Guid userId,
        Guid changedByUserId,
        ChangeUserRoleRequest request);

    Task BanUserAsync(
        Guid userId,
        Guid bannedByUserId,
        BanUserRequest request);

    Task UnbanUserAsync(Guid userId, Guid unbannedByUserId);
}
