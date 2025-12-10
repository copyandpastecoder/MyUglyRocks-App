namespace MyUglyRocks.Core.Entities;

public enum DeviceType
{
    Desktop = 0,
    Mobile = 1,
    Tablet = 2,
    Unknown = 3
}

/// <summary>
/// Tracks user browser/device information for analytics on each login session.
/// Used to make informed decisions about image formats, UI priorities, and feature support.
/// </summary>
public class UserSession : BaseEntity
{
    public Guid UserId { get; set; }

    // Raw User Agent (for debugging/advanced analysis)
    public string? UserAgent { get; set; }

    // Parsed Browser Info
    public string? BrowserName { get; set; }
    public string? BrowserVersion { get; set; }
    public int? BrowserMajorVersion { get; set; }

    // Operating System
    public string? OsName { get; set; }
    public string? OsVersion { get; set; }

    // Device
    public DeviceType DeviceType { get; set; } = DeviceType.Unknown;
    public int? ScreenWidth { get; set; }
    public int? ScreenHeight { get; set; }

    // Feature Support (detected client-side)
    public bool? SupportsWebP { get; set; }
    public bool? SupportsAvif { get; set; }

    // Location/Context (from request headers, not GPS)
    public string? Country { get; set; }
    public string? Timezone { get; set; }
    public string? Language { get; set; }

    // Referrer (how they got here)
    public string? ReferrerDomain { get; set; }

    // Session timing
    public DateTime SessionStart { get; set; }
    public DateTime? SessionEnd { get; set; }
    public int? SessionDurationSeconds { get; set; }

    // Engagement tracking
    public int PageViewCount { get; set; } = 0;

    // Navigation
    public virtual User User { get; set; } = null!;
}
