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
                Id = Guid.NewGuid(),
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

            _logger.LogDebug("Recorded session {SessionId} for user {UserId}", session.Id, userId);
            return session.Id;
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
                Id = Guid.NewGuid(),
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
                session.Id, userId, uaInfo.BrowserName);

            return session.Id;
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

    public async Task UpdateHeartbeatAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        try
        {
            var session = await _dbContext.UserSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

            if (session == null)
            {
                _logger.LogDebug("Session {SessionId} not found for heartbeat", sessionId);
                return;
            }

            session.SessionEnd = DateTime.UtcNow;
            session.SessionDurationSeconds = (int)(session.SessionEnd.Value - session.SessionStart).TotalSeconds;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update heartbeat for session {SessionId}", sessionId);
        }
    }

    public async Task IncrementPageViewAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbContext.UserSessions
                .Where(s => s.Id == sessionId)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.PageViewCount, x => x.PageViewCount + 1),
                    cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to increment page view for session {SessionId}", sessionId);
        }
    }

    public async Task EndSessionAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        try
        {
            var session = await _dbContext.UserSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

            if (session == null) return;

            session.SessionEnd = DateTime.UtcNow;
            session.SessionDurationSeconds = (int)(session.SessionEnd.Value - session.SessionStart).TotalSeconds;

            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogDebug("Ended session {SessionId}", sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to end session {SessionId}", sessionId);
        }
    }

    public async Task<BrowserStatsDto> GetBrowserStatsAsync(int days = 30, CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);

        var sessions = await _dbContext.UserSessions
            .Where(s => s.SessionStart >= cutoff)
            .ToListAsync(cancellationToken);

        var totalSessions = sessions.Count;
        var uniqueUsers = sessions.Select(s => s.UserId).Distinct().Count();

        // Browser breakdown
        var browserBreakdown = sessions
            .Where(s => !string.IsNullOrEmpty(s.BrowserName))
            .GroupBy(s => s.BrowserName!)
            .ToDictionary(g => g.Key, g => g.Count());

        // Device type breakdown
        var deviceTypeBreakdown = sessions
            .GroupBy(s => s.DeviceType.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        // OS breakdown
        var osBreakdown = sessions
            .Where(s => !string.IsNullOrEmpty(s.OsName))
            .GroupBy(s => s.OsName!)
            .ToDictionary(g => g.Key, g => g.Count());

        // WebP/AVIF support
        var sessionsWithWebPData = sessions.Where(s => s.SupportsWebP.HasValue).ToList();
        var webPSupportPercentage = sessionsWithWebPData.Count > 0
            ? Math.Round(sessionsWithWebPData.Count(s => s.SupportsWebP == true) * 100.0 / sessionsWithWebPData.Count, 1)
            : 0;

        var sessionsWithAvifData = sessions.Where(s => s.SupportsAvif.HasValue).ToList();
        var avifSupportPercentage = sessionsWithAvifData.Count > 0
            ? Math.Round(sessionsWithAvifData.Count(s => s.SupportsAvif == true) * 100.0 / sessionsWithAvifData.Count, 1)
            : 0;

        // Users on old browsers (Safari < 14, IE, etc.)
        var usersOnOldBrowsers = sessions
            .Where(s => s.BrowserName == "Safari" && s.BrowserMajorVersion < 14 ||
                        s.BrowserName == "IE" ||
                        s.BrowserName == "Edge" && s.BrowserMajorVersion < 79)
            .Select(s => s.UserId)
            .Distinct()
            .Count();

        // Country breakdown
        var countryBreakdown = sessions
            .Where(s => !string.IsNullOrEmpty(s.Country))
            .GroupBy(s => s.Country!)
            .ToDictionary(g => g.Key, g => g.Count());

        // Timezone breakdown
        var timezoneBreakdown = sessions
            .Where(s => !string.IsNullOrEmpty(s.Timezone))
            .GroupBy(s => s.Timezone!)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .ToDictionary(g => g.Key, g => g.Count());

        // Average session duration
        var sessionsWithDuration = sessions.Where(s => s.SessionDurationSeconds.HasValue).ToList();
        var avgSessionDurationMinutes = sessionsWithDuration.Count > 0
            ? Math.Round(sessionsWithDuration.Average(s => s.SessionDurationSeconds!.Value) / 60.0, 1)
            : 0;

        // Average page views
        var avgPageViewsPerSession = totalSessions > 0
            ? Math.Round(sessions.Average(s => s.PageViewCount), 1)
            : 0;

        // Session trend (daily counts)
        var sessionTrend = sessions
            .GroupBy(s => s.SessionStart.Date)
            .OrderBy(g => g.Key)
            .Select(g => new SessionTrendDto(
                g.Key,
                g.Count(),
                g.Select(s => s.UserId).Distinct().Count()
            ))
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
