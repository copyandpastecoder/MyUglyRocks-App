using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Infrastructure.Data;

namespace MyUglyRocks.Infrastructure.Services;

public class SessionAnalyticsService : ISessionAnalyticsService
{
    private readonly AppDbContext _dbContext;
    private readonly IUserAgentParserService _userAgentParser;
    private readonly ILogger<SessionAnalyticsService> _logger;

    public SessionAnalyticsService(
        AppDbContext dbContext,
        IUserAgentParserService userAgentParser,
        ILogger<SessionAnalyticsService> logger)
    {
        _dbContext = dbContext;
        _userAgentParser = userAgentParser;
        _logger = logger;
    }

    public async Task<Guid> RecordSessionAsync(
        Guid userId,
        SessionInfoRequest sessionInfo,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var session = new UserSession
            {
                UserSessionId = Guid.NewGuid(),
                UserId = userId,
                SessionStart = DateTime.UtcNow,
                ScreenWidth = sessionInfo.ScreenWidth,
                ScreenHeight = sessionInfo.ScreenHeight,
                SupportsWebP = sessionInfo.SupportsWebP,
                SupportsAvif = sessionInfo.SupportsAvif,
                Timezone = SanitizeTimezone(sessionInfo.Timezone),
                Language = SanitizeLanguage(sessionInfo.Language),
                ReferrerDomain = SanitizeReferrerDomain(sessionInfo.ReferrerDomain),
                PageViewCount = 1
            };

            _dbContext.UserSessions.Add(session);
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogDebug("Recorded session {SessionId} for user {UserId}", session.UserSessionId, userId);
            return session.UserSessionId;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record session for user {UserId}", userId);
            return Guid.Empty;
        }
    }

    public async Task<Guid> RecordSessionWithUserAgentAsync(
        Guid userId,
        string? userAgent,
        SessionInfoRequest sessionInfo,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var uaInfo = _userAgentParser.Parse(userAgent);

            // Skip bot sessions
            if (uaInfo.BrowserName == "Bot")
            {
                _logger.LogDebug("Skipping bot session for user {UserId}", userId);
                return Guid.Empty;
            }

            var session = new UserSession
            {
                UserSessionId = Guid.NewGuid(),
                UserId = userId,
                UserAgent = userAgent?.Length > 512 ? userAgent[..512] : userAgent,
                BrowserName = uaInfo.BrowserName,
                BrowserVersion = uaInfo.BrowserVersion,
                BrowserMajorVersion = uaInfo.BrowserMajorVersion,
                OsName = uaInfo.OsName,
                OsVersion = uaInfo.OsVersion,
                DeviceType = MapDeviceType(uaInfo.DeviceType),
                SessionStart = DateTime.UtcNow,
                ScreenWidth = sessionInfo.ScreenWidth,
                ScreenHeight = sessionInfo.ScreenHeight,
                SupportsWebP = sessionInfo.SupportsWebP,
                SupportsAvif = sessionInfo.SupportsAvif,
                Timezone = SanitizeTimezone(sessionInfo.Timezone),
                Language = SanitizeLanguage(sessionInfo.Language),
                ReferrerDomain = SanitizeReferrerDomain(sessionInfo.ReferrerDomain),
                PageViewCount = 1
            };

            _dbContext.UserSessions.Add(session);
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Recorded session {SessionId} for user {UserId} with browser {Browser}",
                session.UserSessionId, userId, uaInfo.BrowserName);

            return session.UserSessionId;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record session for user {UserId}", userId);
            return Guid.Empty;
        }
    }

    private static DeviceType MapDeviceType(DeviceTypeDto dto) => dto switch
    {
        DeviceTypeDto.Desktop => DeviceType.Desktop,
        DeviceTypeDto.Mobile => DeviceType.Mobile,
        DeviceTypeDto.Tablet => DeviceType.Tablet,
        _ => DeviceType.Unknown
    };

    public async Task<bool> UpdateHeartbeatAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var session = await _dbContext.UserSessions
                .FirstOrDefaultAsync(s => s.UserSessionId == sessionId, cancellationToken);

            if (session == null)
            {
                _logger.LogDebug("Session {SessionId} not found for heartbeat", sessionId);
                return false;
            }

            // Verify session belongs to the requesting user (IDOR protection)
            if (session.UserId != userId)
            {
                _logger.LogWarning("User {UserId} attempted to access session {SessionId} belonging to another user", userId, sessionId);
                return false;
            }

            session.SessionEnd = DateTime.UtcNow;
            session.SessionDurationSeconds = (int)(session.SessionEnd.Value - session.SessionStart).TotalSeconds;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update heartbeat for session {SessionId}", sessionId);
            return false;
        }
    }

    public async Task<bool> IncrementPageViewAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Verify session belongs to the requesting user (IDOR protection)
            var rowsAffected = await _dbContext.UserSessions
                .Where(s => s.UserSessionId == sessionId && s.UserId == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.PageViewCount, x => x.PageViewCount + 1),
                    cancellationToken);

            if (rowsAffected == 0)
            {
                _logger.LogWarning("User {UserId} attempted to increment page view for session {SessionId} - not found or unauthorized", userId, sessionId);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to increment page view for session {SessionId}", sessionId);
            return false;
        }
    }

    public async Task<bool> EndSessionAsync(Guid sessionId, Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var session = await _dbContext.UserSessions
                .FirstOrDefaultAsync(s => s.UserSessionId == sessionId, cancellationToken);

            if (session == null)
            {
                return false;
            }

            // Verify session belongs to the requesting user (IDOR protection)
            if (session.UserId != userId)
            {
                _logger.LogWarning("User {UserId} attempted to end session {SessionId} belonging to another user", userId, sessionId);
                return false;
            }

            session.SessionEnd = DateTime.UtcNow;
            session.SessionDurationSeconds = (int)(session.SessionEnd.Value - session.SessionStart).TotalSeconds;

            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogDebug("Ended session {SessionId}", sessionId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to end session {SessionId}", sessionId);
            return false;
        }
    }

    public async Task<BrowserStatsDto> GetBrowserStatsAsync(int days = 30, CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        var sessionsQuery = _dbContext.UserSessions.Where(s => s.SessionStart >= cutoff);

        // Total sessions and unique users - database-level aggregation
        var totalSessions = await sessionsQuery.CountAsync(cancellationToken);
        var uniqueUsers = await sessionsQuery.Select(s => s.UserId).Distinct().CountAsync(cancellationToken);

        // Browser breakdown - database-level grouping
        var browserBreakdown = await sessionsQuery
            .Where(s => s.BrowserName != null && s.BrowserName != "")
            .GroupBy(s => s.BrowserName!)
            .Select(g => new { Browser = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Browser, x => x.Count, cancellationToken);

        // Device type breakdown - database-level grouping
        var deviceTypeBreakdown = await sessionsQuery
            .GroupBy(s => s.DeviceType)
            .Select(g => new { DeviceType = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.DeviceType, x => x.Count, cancellationToken);

        // OS breakdown - database-level grouping
        var osBreakdown = await sessionsQuery
            .Where(s => s.OsName != null && s.OsName != "")
            .GroupBy(s => s.OsName!)
            .Select(g => new { Os = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Os, x => x.Count, cancellationToken);

        // WebP/AVIF support - database-level aggregation
        var webPStats = await sessionsQuery
            .Where(s => s.SupportsWebP.HasValue)
            .GroupBy(s => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Supported = g.Count(s => s.SupportsWebP == true)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var webPSupportPercentage = webPStats != null && webPStats.Total > 0
            ? Math.Round(webPStats.Supported * 100.0 / webPStats.Total, 1)
            : 0;

        var avifStats = await sessionsQuery
            .Where(s => s.SupportsAvif.HasValue)
            .GroupBy(s => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Supported = g.Count(s => s.SupportsAvif == true)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var avifSupportPercentage = avifStats != null && avifStats.Total > 0
            ? Math.Round(avifStats.Supported * 100.0 / avifStats.Total, 1)
            : 0;

        // Users on old browsers - database-level filtering and distinct count
        var usersOnOldBrowsers = await sessionsQuery
            .Where(s => (s.BrowserName == "Safari" && s.BrowserMajorVersion < 14) ||
                        s.BrowserName == "IE" ||
                        (s.BrowserName == "Edge" && s.BrowserMajorVersion < 79))
            .Select(s => s.UserId)
            .Distinct()
            .CountAsync(cancellationToken);

        // Country breakdown - database-level grouping
        var countryBreakdown = await sessionsQuery
            .Where(s => s.Country != null && s.Country != "")
            .GroupBy(s => s.Country!)
            .Select(g => new { Country = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Country, x => x.Count, cancellationToken);

        // Timezone breakdown (top 10) - database-level grouping with ordering
        var timezoneBreakdown = await sessionsQuery
            .Where(s => s.Timezone != null && s.Timezone != "")
            .GroupBy(s => s.Timezone!)
            .Select(g => new { Timezone = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToDictionaryAsync(x => x.Timezone, x => x.Count, cancellationToken);

        // Average session duration - database-level aggregation
        var avgSessionDurationSeconds = await sessionsQuery
            .Where(s => s.SessionDurationSeconds.HasValue)
            .AverageAsync(s => (double?)s.SessionDurationSeconds, cancellationToken);

        var avgSessionDurationMinutes = avgSessionDurationSeconds.HasValue
            ? Math.Round(avgSessionDurationSeconds.Value / 60.0, 1)
            : 0;

        // Average page views - database-level aggregation
        var avgPageViewsPerSession = totalSessions > 0
            ? Math.Round(await sessionsQuery.AverageAsync(s => (double)s.PageViewCount, cancellationToken), 1)
            : 0;

        // Session trend (daily counts) - database-level grouping by date
        // Use a two-step approach for reliable translation:
        // 1. Group sessions by date and UserId to get distinct user sessions per day
        // 2. Count sessions and distinct users per day
        var dailySessionData = await sessionsQuery
            .GroupBy(s => new { s.SessionStart.Date, s.UserId })
            .Select(g => new { g.Key.Date, g.Key.UserId, SessionCount = g.Count() })
            .ToListAsync(cancellationToken);

        var sessionTrend = dailySessionData
            .GroupBy(x => x.Date)
            .Select(g => new SessionTrendDto(
                g.Key,
                g.Sum(x => x.SessionCount),
                g.Select(x => x.UserId).Distinct().Count()
            ))
            .OrderBy(x => x.Date)
            .ToList();

        return new BrowserStatsDto(
            totalSessions,
            uniqueUsers,
            browserBreakdown,
            deviceTypeBreakdown,
            osBreakdown,
            webPSupportPercentage,
            avifSupportPercentage,
            usersOnOldBrowsers,
            countryBreakdown,
            timezoneBreakdown,
            avgSessionDurationMinutes,
            avgPageViewsPerSession,
            sessionTrend
        );
    }

    private static string? SanitizeTimezone(string? timezone)
    {
        if (string.IsNullOrWhiteSpace(timezone)) return null;
        // Basic IANA timezone validation - should contain /
        if (!timezone.Contains('/') && timezone != "UTC") return null;
        return timezone.Length > 64 ? timezone[..64] : timezone;
    }

    private static string? SanitizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language)) return null;
        // Basic BCP-47 validation
        if (language.Length < 2) return null;
        return language.Length > 16 ? language[..16] : language;
    }

    private static string? SanitizeReferrerDomain(string? referrerDomain)
    {
        if (string.IsNullOrWhiteSpace(referrerDomain)) return null;

        try
        {
            // If it's a full URL, extract just the host
            if (referrerDomain.Contains("://"))
            {
                var uri = new Uri(referrerDomain);
                referrerDomain = uri.Host;
            }

            // Remove any path/query components
            var slashIndex = referrerDomain.IndexOf('/');
            if (slashIndex > 0)
            {
                referrerDomain = referrerDomain[..slashIndex];
            }

            return referrerDomain.Length > 128 ? referrerDomain[..128] : referrerDomain;
        }
        catch
        {
            return null;
        }
    }
}
