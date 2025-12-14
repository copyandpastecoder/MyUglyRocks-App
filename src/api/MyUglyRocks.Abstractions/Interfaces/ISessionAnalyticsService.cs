using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface ISessionAnalyticsService
{
    /// <summary>
    /// Records a new session when a user logs in
    /// </summary>
    Task<Guid> RecordSessionAsync(Guid userId, SessionInfoRequest sessionInfo, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates session heartbeat (called periodically while user is active)
    /// </summary>
    /// <returns>True if session exists and belongs to user, false otherwise</returns>
    Task<bool> UpdateHeartbeatAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Increments page view count for a session
    /// </summary>
    /// <returns>True if session exists and belongs to user, false otherwise</returns>
    Task<bool> IncrementPageViewAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ends a session (called on logout)
    /// </summary>
    /// <returns>True if session exists and belongs to user, false otherwise</returns>
    Task<bool> EndSessionAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets browser/device analytics for admin dashboard
    /// </summary>
    Task<BrowserStatsDto> GetBrowserStatsAsync(int days = 30, CancellationToken cancellationToken = default);
}
