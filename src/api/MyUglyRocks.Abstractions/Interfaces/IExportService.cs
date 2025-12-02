using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IExportService
{
    /// <summary>
    /// Export all cycles for a user as CSV
    /// </summary>
    Task<ExportResponse> ExportCyclesAsync(Guid userId, ExportCyclesRequest? request = null);

    /// <summary>
    /// Export a single cycle with all stages as CSV
    /// </summary>
    Task<ExportResponse> ExportCycleAsync(Guid userId, Guid cycleId);

    /// <summary>
    /// Export all stages across all cycles as CSV
    /// </summary>
    Task<ExportResponse> ExportStagesAsync(Guid userId, ExportCyclesRequest? request = null);

    /// <summary>
    /// Export all tumblers as CSV
    /// </summary>
    Task<ExportResponse> ExportTumblersAsync(Guid userId);

    /// <summary>
    /// Export all posts as CSV
    /// </summary>
    Task<ExportResponse> ExportPostsAsync(Guid userId);

    /// <summary>
    /// Export all user data (GDPR compliance) - returns ZIP with multiple CSVs
    /// </summary>
    Task<ExportResponse> ExportFullDataAsync(Guid userId, string password);
}
