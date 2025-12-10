namespace MyUglyRocks.Abstractions.DTOs;

/// <summary>
/// Session info sent from frontend during login
/// </summary>
public record SessionInfoRequest(
    int? ScreenWidth = null,
    int? ScreenHeight = null,
    bool? SupportsWebP = null,
    bool? SupportsAvif = null,
    string? Timezone = null,
    string? Language = null,
    string? ReferrerDomain = null
);

/// <summary>
/// Extended login request with optional analytics fields
/// </summary>
public record LoginWithAnalyticsRequest(
    string Email,
    string Password,
    int? ScreenWidth = null,
    int? ScreenHeight = null,
    bool? SupportsWebP = null,
    bool? SupportsAvif = null,
    string? Timezone = null,
    string? Language = null,
    string? ReferrerDomain = null
);

/// <summary>
/// Browser/device statistics for admin dashboard
/// </summary>
public record BrowserStatsDto(
    int TotalSessions,
    int UniqueUsers,
    Dictionary<string, int> BrowserBreakdown,
    Dictionary<string, int> DeviceTypeBreakdown,
    Dictionary<string, int> OsBreakdown,
    double WebPSupportPercentage,
    double AvifSupportPercentage,
    int UsersOnOldBrowsers,
    Dictionary<string, int> CountryBreakdown,
    Dictionary<string, int> TimezoneBreakdown,
    double AvgSessionDurationMinutes,
    double AvgPageViewsPerSession,
    List<SessionTrendDto> SessionTrend
);

/// <summary>
/// Daily session count for trend chart
/// </summary>
public record SessionTrendDto(
    DateTime Date,
    int SessionCount,
    int UniqueUsers
);
