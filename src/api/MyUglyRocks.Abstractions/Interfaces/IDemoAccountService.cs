using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IDemoAccountService
{
    /// <summary>
    /// Creates a demo account with generated data and triggers photo copying job.
    /// Returns immediately with account details and password.
    /// </summary>
    Task<DemoAccountCreatedResponse> CreateDemoAccountAsync(
        CreateDemoAccountRequest request,
        Guid createdByAdminId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists all demo accounts with statistics
    /// </summary>
    Task<List<DemoAccountListDto>> GetDemoAccountsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hard deletes a demo account and all associated data (R2 files + database records).
    /// Verifies is_demo_account flag before deletion.
    /// </summary>
    Task<DemoAccountDeletionResult> DeleteDemoAccountAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Copies photos from source account to demo account.
    /// Can be called as background job or manually from admin panel.
    /// </summary>
    Task<PhotoCopyJobResult> CopyPhotosForDemoAccountAsync(
        Guid demoUserId,
        Guid sourceUserId,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Manually trigger photo copying for a demo account (Admin panel).
    /// Uses environment-specific source account.
    /// </summary>
    Task<PhotoCopyJobResult> TriggerPhotoCopyAsync(
        Guid demoUserId,
        Guid adminUserId,
        CancellationToken cancellationToken = default);
}
