# ADR-006: User Session Analytics Table

## Status
**Proposed**

## Date
2025-12-09

## Context

We need to track user browser/device information to make informed decisions about:
1. **Image format support** - Determine if it's safe to convert all images to WebP
2. **Mobile vs Desktop usage** - Prioritize UI/UX improvements
3. **Feature support** - Know what browser capabilities users have
4. **User engagement** - Understand how users interact with the platform
5. **Geographic distribution** - Inform CDN and localization decisions

### Requirements
1. Track browser and device information on each login/session
2. Store historical data to identify trends over time
3. Minimal performance impact on authentication flow
4. Privacy-conscious (no PII beyond what's necessary)
5. Queryable for admin dashboard statistics

### Options Considered

#### Option A: Add fields to User table
- **Pros:** Simple, no new tables
- **Cons:** Only stores last login info, no historical trends

#### Option B: Dedicated UserSession table (Selected)
- **Pros:** Full history, trend analysis, rich analytics
- **Cons:** More storage, requires cleanup strategy

#### Option C: External analytics tool (Plausible, PostHog)
- **Pros:** Full-featured, maintained by experts
- **Cons:** External dependency, cost, less control

## Decision

**Implement a dedicated `UserSession` table** to capture browser/device analytics on each login.

---

## Implementation Plan

### Cross-Cutting Safeguards
- Keep analytics capture non-blocking for authentication (log and continue on failure; prefer background/offline ingestion).
- Apply strict field length caps and format validation to prevent oversized payloads and inconsistent data.
- Document consent/disclosure and admin-only access for analytics endpoints.
- Plan for bot filtering so stats reflect real user behaviour.

### Phase 1: Database Schema

#### 1.1 Create UserSession Entity

```csharp
// filepath: src/api/MyUglyRocks.Core/Entities/UserSession.cs
namespace MyUglyRocks.Core.Entities;

public enum DeviceType
{
    Desktop = 0,
    Mobile = 1,
    Tablet = 2,
    Unknown = 3
}

public class UserSession : BaseEntity
{
    public Guid UserId { get; set; }
    
    // Raw User Agent (for debugging/advanced analysis)
    public string? UserAgent { get; set; }
    
    // Parsed Browser Info
    public string? BrowserName { get; set; }        // Chrome, Safari, Firefox, Edge
    public string? BrowserVersion { get; set; }     // 120.0.0
    public int? BrowserMajorVersion { get; set; }   // 120 (for easy queries)
    
    // Operating System
    public string? OsName { get; set; }             // Windows, macOS, iOS, Android, Linux
    public string? OsVersion { get; set; }          // 11, 14.2, etc.
    
    // Device
    public DeviceType DeviceType { get; set; } = DeviceType.Unknown;
    public int? ScreenWidth { get; set; }
    public int? ScreenHeight { get; set; }
    
    // Feature Support (detected client-side)
    public bool? SupportsWebP { get; set; }
    public bool? SupportsAvif { get; set; }
    
    // Location/Context (from request headers, not GPS)
    public string? Country { get; set; }            // ISO country code (US, GB, CA)
    public string? Timezone { get; set; }           // IANA timezone (America/New_York)
    public string? Language { get; set; }           // Browser language (en-US, es-MX)
    
    // Referrer (how they got here)
    public string? ReferrerDomain { get; set; }     // google.com, reddit.com (not full URL for privacy)
    
    // Session timing
    public DateTime SessionStart { get; set; }
    public DateTime? SessionEnd { get; set; }
    public int? SessionDurationSeconds { get; set; }
    
    // IP (hashed for privacy, used for country lookup then discarded)
    // We do NOT store raw IP addresses
    
    // Navigation
    public virtual User User { get; set; } = null!;
}
```

#### 1.2 Add DbSet to AppDbContext

```csharp
// In AppDbContext.cs
public DbSet<UserSession> UserSessions => Set<UserSession>();
```

#### 1.3 Create Migration

```powershell
cd src/api/MyUglyRocks.Api
dotnet ef migrations add AddUserSessionAnalytics --project ../MyUglyRocks.Infrastructure
```

#### 1.4 Add Index for Performance

```csharp
// In AppDbContext OnModelCreating
modelBuilder.Entity<UserSession>(entity =>
{
    entity.HasIndex(e => e.UserId);
    entity.HasIndex(e => e.SessionStart);
    entity.HasIndex(e => e.BrowserName);
    entity.HasIndex(e => e.DeviceType);
    entity.HasIndex(e => new { e.SupportsWebP, e.SessionStart }); // For WebP analysis
    entity.HasIndex(e => new { e.SessionStart, e.Country });
    entity.HasIndex(e => new { e.SessionStart, e.BrowserName, e.BrowserMajorVersion });
});
```

#### 1.5 Enforce Field Lengths and Formats
- Cap string fields (e.g., `UserAgent` 512, `BrowserName/Version` 64, `OsName/Version` 64, `Language` 16, `Timezone` 64, `ReferrerDomain` 128, `Country` 2).
- Validate formats before persist: timezone as IANA, language as BCP-47, referrer as hostname only (strip query/path/fragment).
- Default `SessionStart` to `DateTime.UtcNow` and guard against null/empty user agents.

---

### Phase 2: Backend Implementation

#### 2.1 User Agent Parser Service

Install NuGet package:
```xml
<PackageReference Include="UAParser" Version="3.1.47" />
```

```csharp
// filepath: src/api/MyUglyRocks.Infrastructure/Services/UserAgentParserService.cs
using UAParser;

public interface IUserAgentParserService
{
    UserAgentInfo Parse(string userAgent);
}

public record UserAgentInfo(
    string BrowserName,
    string BrowserVersion,
    int? BrowserMajorVersion,
    string OsName,
    string OsVersion,
    DeviceType DeviceType
);

public class UserAgentParserService : IUserAgentParserService
{
    private readonly Parser _parser = Parser.GetDefault();
    
    public UserAgentInfo Parse(string userAgent)
    {
        var clientInfo = _parser.Parse(userAgent);
        
        var deviceType = clientInfo.Device.Family.ToLower() switch
        {
            "iphone" or "android" or "mobile" => DeviceType.Mobile,
            "ipad" or "tablet" => DeviceType.Tablet,
            _ => DeviceType.Desktop
        };
        
        int.TryParse(clientInfo.UA.Major, out var majorVersion);
        
        return new UserAgentInfo(
            clientInfo.UA.Family,
            $"{clientInfo.UA.Major}.{clientInfo.UA.Minor}.{clientInfo.UA.Patch}",
            majorVersion,
            clientInfo.OS.Family,
            $"{clientInfo.OS.Major}.{clientInfo.OS.Minor}",
            deviceType
        );
    }
}
```

#### 2.2 Session Analytics Service

```csharp
// filepath: src/api/MyUglyRocks.Core/Services/SessionAnalyticsService.cs
public interface ISessionAnalyticsService
{
    Task RecordSessionAsync(Guid userId, SessionInfo sessionInfo);
    Task<BrowserStatsDto> GetBrowserStatsAsync(int days = 30);
}

public record SessionInfo(
    string? UserAgent,
    int? ScreenWidth,
    int? ScreenHeight,
    bool? SupportsWebP,
    bool? SupportsAvif,
    string? Timezone,
    string? Language,
    string? ReferrerDomain
);
```

#### 2.3 Update Login Endpoint

Modify `AuthController.Login` to:
1. Accept optional `SessionInfo` in request body
2. Parse User-Agent header
3. Create `UserSession` record

```csharp
// In LoginRequest DTO, add optional fields:
public record LoginRequest(
    string Email,
    string Password,
    // Optional analytics fields (sent from frontend)
    int? ScreenWidth = null,
    int? ScreenHeight = null,
    bool? SupportsWebP = null,
    bool? SupportsAvif = null,
    string? Timezone = null,
    string? ReferrerDomain = null
);
```

#### 2.4 Non-Blocking Ingestion
- Wrap session recording in a fire-and-forget/background dispatch (e.g., queue/outbox or hosted service) so login latency is unaffected.
- If parsing/persisting fails, log and continue without blocking authentication.

#### 2.5 Session Timing Strategy
- If `SessionEnd`/`SessionDurationSeconds` are retained, add a heartbeat/logout hook to populate them; otherwise omit them from the initial migration.

#### 2.6 Bot Filtering
- Add basic bot detection (user-agent heuristics + allowlist/denylist) to drop known crawlers from analytics.

---

### Phase 3: Frontend Implementation

#### 3.1 Detect Browser Capabilities

```typescript
// filepath: src/web/src/lib/browser-capabilities.ts
export interface BrowserCapabilities {
  screenWidth: number;
  screenHeight: number;
  supportsWebP: boolean;
  supportsAvif: boolean;
  timezone: string;
  language: string;
  referrerDomain: string | null;
}

export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    supportsWebP: await checkWebPSupport(),
    supportsAvif: await checkAvifSupport(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    referrerDomain: document.referrer ? new URL(document.referrer).hostname : null,
  };
}

async function checkWebPSupport(): Promise<boolean> {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

async function checkAvifSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    // 1x1 AVIF image
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABc0WkCLfkf8A';
  });
}
```

#### 3.2 Send on Login

```typescript
// In login function
const capabilities = await detectBrowserCapabilities();

const response = await authApi.login({
  email,
  password,
  ...capabilities,
});
```

#### 3.3 Frontend Guardrails
- Memoize capability checks per page load and add a timeout on AVIF/WebP probes to avoid blocking login.
- Wrap `new URL(document.referrer)` in try/catch and fallback to `null` on malformed referrers.

---

### Phase 4: Admin Dashboard

#### 4.1 Add Browser Stats DTO

```csharp
// filepath: src/api/MyUglyRocks.Abstractions/DTOs/AdminDtos.cs
public record BrowserStatsDto(
    int TotalSessions,
    int UniqueBrowsers,
    Dictionary<string, int> BrowserBreakdown,      // Chrome: 150, Safari: 80, etc.
    Dictionary<string, int> DeviceTypeBreakdown,   // Desktop: 180, Mobile: 50
    Dictionary<string, int> OsBreakdown,           // Windows: 100, iOS: 80, etc.
    double WebPSupportPercentage,                  // 98.5%
    double AvifSupportPercentage,                  // 72.3%
    int UsersOnOldSafari,                          // Safari < 14 (no WebP)
    Dictionary<string, int> CountryBreakdown,      // US: 200, UK: 50, etc.
    Dictionary<string, int> TimezoneBreakdown      // For activity patterns
);
```

#### 4.2 Add Admin Endpoint

```csharp
// In AdminController.cs
[Authorize(Roles = "Admin")]
[HttpGet("browser-stats")]
public async Task<ActionResult<BrowserStatsDto>> GetBrowserStats(
    [FromQuery] int days = 30)
{
    var stats = await _sessionAnalyticsService.GetBrowserStatsAsync(days);
    return Ok(stats);
}
```

#### 4.3 Add Admin UI Page

Create new page at `/admin/analytics` showing:
- Pie chart: Browser distribution
- Pie chart: Device types (Desktop/Mobile/Tablet)
- Bar chart: OS distribution
- **Key metric card:** "WebP Support: 98.5% of users"
- Table: Users on browsers that don't support WebP
- Line chart: Sessions over time

#### 4.4 Access Control and Query Performance
- Restrict page navigation to Admin role; hide links for non-admin users.
- Cache aggregated stats (e.g., 5-minute TTL) to avoid expensive queries on every page load.

---

### Phase 5: Data Retention & Privacy

#### 5.1 Retention Policy

Add a background job to clean up old sessions:

```csharp
// Keep sessions for 90 days, then delete
public async Task CleanupOldSessionsAsync()
{
    var cutoff = DateTime.UtcNow.AddDays(-90);
    await _dbContext.UserSessions
        .Where(s => s.SessionStart < cutoff)
        .ExecuteDeleteAsync();
}
```

Schedule as a nightly job and record deletion counts to confirm enforcement.

#### 5.2 Privacy and Consent
- No raw IP addresses stored; derive country from the request IP in-memory and discard (optional hash only in memory if needed).
- Store referrer domain only; strip path/query/fragment before persisting.
- Store user-agent for debugging, but only expose aggregated statistics in the UI/API.
- 90-day retention enforced by the scheduled cleanup; log metrics for auditability.
- Document analytics collection in the privacy policy and obtain consent/opt-out where required (GDPR/CCPA); honor user deletion requests by deleting their sessions.

#### 5.3 Feature Flag
- Gate login-time session capture behind a feature flag for a staged rollout and to measure DB impact before full enablement.

---

## Task Checklist

### Backend
- [ ] Create `UserSession` entity
- [ ] Create `DeviceType` enum
- [ ] Add `DbSet<UserSession>` to AppDbContext
- [ ] Add entity configuration with indexes and length/format constraints
- [ ] Create and run migration
- [ ] Install UAParser NuGet package
- [ ] Create `IUserAgentParserService` and implementation
- [ ] Create `ISessionAnalyticsService` and implementation
- [ ] Register services in DI
- [ ] Update `LoginRequest` DTO with optional analytics fields
- [ ] Update `AuthController.Login` to record session (non-blocking)
- [ ] Add `BrowserStatsDto`
- [ ] Add `GET /api/admin/browser-stats` endpoint with RBAC and caching
- [ ] Add bot filtering heuristics
- [ ] Decide on session timing approach (retain or remove end/duration)
- [ ] Add session cleanup background job with metrics
- [ ] Add feature flag for analytics capture

### Frontend
- [ ] Create `browser-capabilities.ts` utility
- [ ] Update login flow to detect and send capabilities
- [ ] Memoize capability checks, add timeouts, and guard referrer parsing
- [ ] Create `/admin/analytics` page
- [ ] Add browser stats visualizations (charts)

### Documentation
- [ ] Update `04-DATA-MODEL.md` with UserSession entity
- [ ] Update Privacy Policy with analytics disclosure and consent handling

---

## Success Metrics

After implementation, we should be able to answer:
1. **"What % of users support WebP?"** - Target: >95% to safely convert images
2. **"What % of users are on mobile?"** - Informs UI priorities
3. **"Where are our users located?"** - Informs CDN decisions
4. **"Which browsers need testing?"** - Focus QA efforts

---

## References

- [UAParser .NET](https://github.com/ua-parser/uap-csharp) - User agent parsing library
- [WebP Browser Support](https://caniuse.com/webp) - Safari 14+ (Sept 2020)
- [AVIF Browser Support](https://caniuse.com/avif) - Safari 16+ (Sept 2022)
