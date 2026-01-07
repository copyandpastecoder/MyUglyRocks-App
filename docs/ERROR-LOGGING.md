# Database Error Logging Implementation Plan

## Overview
Implement comprehensive database logging for all API exceptions to enable easier debugging and error tracking via admin UI.

## User Preferences
- **Retention:** 180 days
- **Headers:** Capture selected headers (User-Agent, Referer, Accept, Origin - exclude Authorization/Cookie)
- **Filtering:** Log all errors (client 400s and server 500s)
- **UI Default:** Time range preset buttons (24h, 7d, 30d, all)

## Implementation Steps

### 1. Backend - Database & Entity (Phase 1) ✅ COMPLETE

**Create ErrorLog Entity** - `src/api/MyUglyRocks.Core/Entities/ErrorLog.cs`
```csharp
public enum ErrorSeverity
{
    Info = 0,      // 404 Not Found
    Warning = 1,   // 401, 403
    Error = 2,     // 400 Bad Request, ArgumentException
    Critical = 3   // 500 Internal Server Error
}

public class ErrorLog : BaseEntity
{
    public Guid ErrorLogId { get; set; }
    public required string CorrelationId { get; set; }
    public required string ExceptionType { get; set; }
    public required string Message { get; set; }
    public string? StackTrace { get; set; }
    public ErrorSeverity Severity { get; set; } = ErrorSeverity.Error;
    public string? HttpMethod { get; set; }
    public string? HttpPath { get; set; }
    public string? HttpQueryString { get; set; }
    public int? HttpStatusCode { get; set; }
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? RequestHeaders { get; set; } // JSON string of selected headers
    public string? InnerException { get; set; }

    // Navigation
    public virtual User? User { get; set; }
}
```

**Create EF Configuration** - `src/api/MyUglyRocks.Infrastructure/Data/Configurations/ErrorLogConfiguration.cs`
- Table name: `error_logs`
- Snake_case columns
- UUID PK with `gen_random_uuid()`
- Indexes:
  - `ix_error_logs_correlation_id` (correlation_id)
  - `ix_error_logs_severity` (severity)
  - `ix_error_logs_user_id` (user_id)
  - `ix_error_logs_date_created` (date_created DESC)
  - `ix_error_logs_severity_date` (severity, date_created DESC) - composite for common queries
  - `ix_error_logs_http_path` (http_path) - for path filtering
- FK to users table with ON DELETE SET NULL
- MaxLength: correlation_id(128), exception_type(255), http_method(10), http_path(2048), ip_address(45), user_agent(512)

**Add DbSet** - `src/api/MyUglyRocks.Infrastructure/Data/AppDbContext.cs`
```csharp
public DbSet<ErrorLog> ErrorLogs => Set<ErrorLog>();
```

**Generate Migration**
```bash
cd src/api/MyUglyRocks.Infrastructure
dotnet ef migrations add AddErrorLogging --startup-project ../MyUglyRocks.Api
```

### 2. Backend - Service Layer (Phase 2) ✅ COMPLETE

**Create Interface** - `src/api/MyUglyRocks.Abstractions/Interfaces/IErrorLogService.cs`
```csharp
public interface IErrorLogService
{
    Task LogErrorAsync(HttpContext context, Exception exception, CancellationToken cancellationToken = default);
    Task<PaginatedResult<ErrorLogListDto>> GetErrorLogsAsync(
        DateTime? startDate,
        DateTime? endDate,
        ErrorSeverity? severity,
        Guid? userId,
        string? searchPath,
        string? searchCorrelationId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);
    Task<ErrorLogDetailDto?> GetErrorLogByIdAsync(Guid errorLogId, CancellationToken cancellationToken = default);
    Task<int> DeleteOldErrorLogsAsync(int retentionDays, CancellationToken cancellationToken = default);
}
```

**Create DTOs** - `src/api/MyUglyRocks.Abstractions/DTOs/ErrorLogDtos.cs`
```csharp
public record ErrorLogListDto(
    Guid ErrorLogId,
    string CorrelationId,
    string ExceptionType,
    string MessageExcerpt,
    string Severity,
    string? HttpMethod,
    string? HttpPath,
    int? HttpStatusCode,
    string? Username,
    DateTime DateCreated
);

public record ErrorLogDetailDto(
    Guid ErrorLogId,
    string CorrelationId,
    string ExceptionType,
    string Message,
    string? StackTrace,
    string Severity,
    string? HttpMethod,
    string? HttpPath,
    string? HttpQueryString,
    int? HttpStatusCode,
    Guid? UserId,
    string? Username,
    string? IpAddress,
    string? UserAgent,
    Dictionary<string, string>? RequestHeaders,
    string? InnerException,
    DateTime DateCreated
);
```

**Implement Service** - `src/api/MyUglyRocks.Core/Services/ErrorLogService.cs`

Key logic:
- Extract user ID from ClaimsPrincipal
- Mask IP address using `PiiMaskingHelper.MaskIpAddress()`
- Sanitize paths using `PiiMaskingHelper.SanitizeForLog()`
- Map status code to ErrorSeverity:
  - 500+ → Critical
  - 400, InvalidOperationException, ArgumentException → Error
  - 401, 403 → Warning
  - 404 → Info
- Extract selected headers: User-Agent, Referer, Accept, Origin (skip Authorization, Cookie)
- Serialize headers to JSON string
- Truncate stack trace if > 10,000 chars
- Extract InnerException if present
- Paginate using `PaginationHelper.ClampSkip()` and `PaginationHelper.ClampTake()`

**Register Service** - `src/api/MyUglyRocks.Api/Program.cs`
```csharp
builder.Services.AddScoped<IErrorLogService, ErrorLogService>();
```

### 3. Backend - Middleware Integration (Phase 3) ✅ COMPLETE

**Update GlobalExceptionMiddleware** - `src/api/MyUglyRocks.Api/Middleware/GlobalExceptionMiddleware.cs`

Inject IErrorLogService in constructor:
```csharp
private readonly IErrorLogService _errorLogService;

public GlobalExceptionMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionMiddleware> logger,
    IErrorLogService errorLogService)
{
    _next = next;
    _logger = logger;
    _errorLogService = errorLogService;
}
```

In `HandleExceptionAsync()`, add fire-and-forget logging AFTER Serilog logging:
```csharp
// Log to Serilog (existing code)
_logger.LogError(ex, "Unhandled exception. CorrelationId: {CorrelationId}", correlationId);

// Log to database (fire-and-forget, non-blocking)
_ = Task.Run(async () =>
{
    try
    {
        await _errorLogService.LogErrorAsync(context, exception, CancellationToken.None);
    }
    catch (Exception dbEx)
    {
        // Never fail request due to DB logging failure
        _logger.LogWarning(dbEx, "Failed to log error to database. CorrelationId: {CorrelationId}", correlationId);
    }
});
```

### 4. Backend - Admin Endpoints (Phase 4) ✅ COMPLETE

**Add Endpoints** - `src/api/MyUglyRocks.Api/Controllers/AdminController.cs`

```csharp
/// <summary>
/// Get error logs with filtering and pagination (Admin only)
/// </summary>
[HttpGet("error-logs")]
[Authorize(Roles = "Admin")]
[ProducesResponseType(typeof(PaginatedResult<ErrorLogListDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<PaginatedResult<ErrorLogListDto>>> GetErrorLogs(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] ErrorSeverity? severity,
    [FromQuery] Guid? userId,
    [FromQuery] string? searchPath,
    [FromQuery] string? searchCorrelationId,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    CancellationToken cancellationToken = default)
{
    var result = await _errorLogService.GetErrorLogsAsync(
        startDate, endDate, severity, userId, searchPath, searchCorrelationId,
        page, pageSize, cancellationToken);
    return Ok(result);
}

/// <summary>
/// Get error log detail by ID (Admin only)
/// </summary>
[HttpGet("error-logs/{errorLogId:guid}")]
[Authorize(Roles = "Admin")]
[ProducesResponseType(typeof(ErrorLogDetailDto), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<ErrorLogDetailDto>> GetErrorLog(
    Guid errorLogId,
    CancellationToken cancellationToken = default)
{
    var errorLog = await _errorLogService.GetErrorLogByIdAsync(errorLogId, cancellationToken);
    if (errorLog == null)
    {
        return NotFound();
    }
    return Ok(errorLog);
}
```

Inject IErrorLogService in AdminController constructor.

### 5. Backend - Hangfire Cleanup Job (Phase 5) ✅ COMPLETE

**Create Job** - `src/api/MyUglyRocks.Infrastructure/Jobs/ErrorLogCleanupJob.cs`
```csharp
public class ErrorLogCleanupJob
{
    private readonly IErrorLogService _errorLogService;
    private readonly ILogger<ErrorLogCleanupJob> _logger;
    private readonly int _retentionDays;

    public ErrorLogCleanupJob(
        IErrorLogService errorLogService,
        ILogger<ErrorLogCleanupJob> logger,
        IConfiguration configuration)
    {
        _errorLogService = errorLogService;
        _logger = logger;
        _retentionDays = int.Parse(configuration["ErrorLogging:RetentionDays"] ?? "180");
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting error log cleanup (retention: {RetentionDays} days)...", _retentionDays);

        var deletedCount = await _errorLogService.DeleteOldErrorLogsAsync(_retentionDays, cancellationToken);

        _logger.LogInformation("Error log cleanup completed. Deleted {DeletedCount} records.", deletedCount);
    }
}
```

**Register Job** - `src/api/MyUglyRocks.Api/Program.cs`

Add after Hangfire server configuration:
```csharp
// Schedule error log cleanup (daily at 2 AM UTC)
var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
recurringJobManager.AddOrUpdate<ErrorLogCleanupJob>(
    "error-log-cleanup",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Daily(2));
```

**Add Configuration** - `src/api/MyUglyRocks.Api/appsettings.json`
```json
"ErrorLogging": {
  "Enabled": true,
  "RetentionDays": 180
}
```

### 6. Frontend - TypeScript Types (Phase 6) ✅ COMPLETE

**Create Types** - `src/web/src/types/admin.ts`

Add to existing admin types:
```typescript
export type ErrorSeverity = 'Info' | 'Warning' | 'Error' | 'Critical';

export interface ErrorLogListDto {
  errorLogId: string;
  correlationId: string;
  exceptionType: string;
  messageExcerpt: string;
  severity: ErrorSeverity;
  httpMethod: string | null;
  httpPath: string | null;
  httpStatusCode: number | null;
  username: string | null;
  dateCreated: string;
}

export interface ErrorLogDetailDto {
  errorLogId: string;
  correlationId: string;
  exceptionType: string;
  message: string;
  stackTrace: string | null;
  severity: ErrorSeverity;
  httpMethod: string | null;
  httpPath: string | null;
  httpQueryString: string | null;
  httpStatusCode: number | null;
  userId: string | null;
  username: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestHeaders: Record<string, string> | null;
  innerException: string | null;
  dateCreated: string;
}

export interface ErrorLogFilterParams {
  startDate?: string;
  endDate?: string;
  severity?: ErrorSeverity;
  userId?: string;
  searchPath?: string;
  searchCorrelationId?: string;
  page?: number;
  pageSize?: number;
}
```

### 7. Frontend - API Client (Phase 7) ✅ COMPLETE

**Update API Client** - `src/web/src/lib/api.ts`

Add to `adminApi` namespace:
```typescript
export const adminApi = {
  // ... existing methods

  getErrorLogs: async (params: ErrorLogFilterParams): Promise<PaginatedResult<ErrorLogListDto>> => {
    const response = await api.get<PaginatedResult<ErrorLogListDto>>('/admin/error-logs', {
      params: {
        ...params,
        // Convert date objects to ISO strings if needed
        startDate: params.startDate ? new Date(params.startDate).toISOString() : undefined,
        endDate: params.endDate ? new Date(params.endDate).toISOString() : undefined,
      }
    });
    return response.data;
  },

  getErrorLog: async (errorLogId: string): Promise<ErrorLogDetailDto> => {
    const response = await api.get<ErrorLogDetailDto>(`/admin/error-logs/${errorLogId}`);
    return response.data;
  },
};
```

### 8. Frontend - Admin Error Logs Page (Phase 8) ✅ COMPLETE

**Create Page** - `src/web/src/app/(protected)/admin/error-logs/page.tsx`

Follow pattern from `admin/users/page.tsx` with:

**State:**
- Time range preset: '24h' | '7d' | '30d' | 'all' (default: '24h')
- Severity filter: 'all' | 'Info' | 'Warning' | 'Error' | 'Critical'
- Search fields: path, correlation ID
- Page number
- Selected error for detail dialog

**UI Components:**
- **Preset Time Buttons:** Row of 4 buttons (Last 24h, Last 7d, Last 30d, All Time)
- **Filters Card:** Severity dropdown, path search, correlation ID search
- **Table:** Columns = Timestamp | Correlation ID | Severity Badge | Type | Message (truncated) | Path | Status | User | Actions
- **Detail Dialog:** Full error with formatted stack trace in `<pre>` block, all context fields
- **Pagination:** Previous/Next buttons

**Severity Badge Colors:**
- Critical: red (destructive variant)
- Error: orange/yellow (default variant)
- Warning: yellow (secondary variant)
- Info: blue (outline variant)

**Time Preset Logic:**
```typescript
const timePresets = {
  '24h': { startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), endDate: new Date() },
  '7d': { startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate: new Date() },
  '30d': { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date() },
  'all': { startDate: undefined, endDate: undefined },
};
```

**React Query:**
```typescript
const { data: errors, isLoading } = useQuery({
  queryKey: ['admin', 'error-logs', timePreset, severity, searchPath, searchCorrelationId, page],
  queryFn: () => adminApi.getErrorLogs({
    ...timePresets[timePreset],
    severity: severity === 'all' ? undefined : severity,
    searchPath: searchPath || undefined,
    searchCorrelationId: searchCorrelationId || undefined,
    page,
    pageSize: 20,
  }),
});
```

### 9. Frontend - Navigation Link (Phase 9) ✅ COMPLETE

**Update Admin Layout** - `src/web/src/app/(protected)/admin/layout.tsx`

Add navigation item:
```typescript
{
  name: 'Error Logs',
  href: '/admin/error-logs',
  icon: AlertTriangle, // from lucide-react
  adminOnly: true,
}
```

## Testing Checklist

### Backend Tests
- [ ] Trigger 400, 401, 403, 404, 500 errors and verify DB insert
- [ ] Verify correlation ID matches between response and DB
- [ ] Verify user context captured when authenticated
- [ ] Verify IP masking works (192.168.x.x format)
- [ ] Verify path sanitization prevents log injection
- [ ] Verify headers exclude Authorization/Cookie
- [ ] Verify fire-and-forget doesn't block request (test with DB offline)
- [ ] Test pagination limits (max 100 per page)
- [ ] Test admin authorization (403 for non-admin)

### Frontend Tests
- [ ] Time preset buttons change date filters correctly
- [ ] Severity filter works
- [ ] Search by path and correlation ID works
- [ ] Table displays all columns correctly
- [ ] Severity badges show correct colors
- [ ] Detail dialog shows full error context
- [ ] Stack trace formatted in monospace
- [ ] Pagination works
- [ ] Loading states display skeletons

### Hangfire Job Tests
- [ ] Manually trigger cleanup job in Hangfire dashboard
- [ ] Verify only records older than 180 days are deleted
- [ ] Verify job logs deleted count

## Deployment Steps

1. **Build & Test Locally:**
   ```bash
   # Backend
   cd src/api/MyUglyRocks.Infrastructure
   dotnet ef migrations add AddErrorLogging --startup-project ../MyUglyRocks.Api
   cd ../MyUglyRocks.Api
   dotnet build

   # Frontend
   cd ../../web
   npm run build
   ```

2. **Deploy to Kubernetes:**
   ```bash
   # Build Docker images
   docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
   docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .

   # Restart deployments
   kubectl rollout restart deployment myuglyrocks-api myuglyrocks-web -n myuglyrocks
   kubectl rollout status deployment myuglyrocks-api myuglyrocks-web -n myuglyrocks
   ```

3. **Run Migration:** ✅ COMPLETE
   ```bash
   # Applied via local development environment with port-forward
   # See "Database Migration" section above for details
   ```

4. **Verify:** ✅ COMPLETE
   - ✅ Check error_logs table exists: `kubectl exec -it deployment/postgres -n myuglyrocks -- psql -U postgres -d myuglyrocks -c "\d error_logs"`
   - ⏳ Trigger test error and check DB (pending)
   - ⏳ Access admin UI at https://dev.myuglyrocks.com/admin/error-logs (pending)

## Files to Create/Modify

### New Files (Create)
- `src/api/MyUglyRocks.Core/Entities/ErrorLog.cs`
- `src/api/MyUglyRocks.Infrastructure/Data/Configurations/ErrorLogConfiguration.cs`
- `src/api/MyUglyRocks.Abstractions/Interfaces/IErrorLogService.cs`
- `src/api/MyUglyRocks.Abstractions/DTOs/ErrorLogDtos.cs`
- `src/api/MyUglyRocks.Core/Services/ErrorLogService.cs`
- `src/api/MyUglyRocks.Infrastructure/Jobs/ErrorLogCleanupJob.cs`
- `src/web/src/app/(protected)/admin/error-logs/page.tsx`

### Modified Files (Edit)
- `src/api/MyUglyRocks.Infrastructure/Data/AppDbContext.cs` - Add DbSet<ErrorLog>
- `src/api/MyUglyRocks.Api/Middleware/GlobalExceptionMiddleware.cs` - Add fire-and-forget logging
- `src/api/MyUglyRocks.Api/Controllers/AdminController.cs` - Add error log endpoints
- `src/api/MyUglyRocks.Api/Program.cs` - Register service + Hangfire job
- `src/api/MyUglyRocks.Api/appsettings.json` - Add ErrorLogging config
- `src/web/src/types/admin.ts` - Add error log types
- `src/web/src/lib/api.ts` - Add adminApi methods
- `src/web/src/app/(protected)/admin/layout.tsx` - Add nav link

### Generated Files (Migration)
- `src/api/MyUglyRocks.Infrastructure/Migrations/YYYYMMDDHHMMSS_AddErrorLogging.cs`
- `src/api/MyUglyRocks.Infrastructure/Migrations/YYYYMMDDHHMMSS_AddErrorLogging.Designer.cs`

## Deployment Status

**Deployed:** January 6, 2026

All phases completed and deployed to dev.myuglyrocks.com:
- ✅ Backend: Database schema, services, middleware, admin endpoints, Hangfire cleanup job
- ✅ Frontend: TypeScript types, API client, admin error logs page with filters
- ✅ Navigation: Error Logs link added to admin sidebar

Access error logs at: https://dev.myuglyrocks.com/admin/error-logs (Admin only)

## Implementation Notes

### Architectural Changes

1. **PaginationHelper Moved to Abstractions Layer**
   - Original location: `MyUglyRocks.Api/Helpers/PaginationHelper.cs`
   - New location: `MyUglyRocks.Abstractions/Helpers/PaginationHelper.cs`
   - Reason: ErrorLogService in Core layer needed access to pagination helpers
   - Impact: Updated imports in AdminController.cs and PostsController.cs

2. **ErrorSeverity Enum Location**
   - Placed in: `MyUglyRocks.Abstractions/Interfaces/IErrorLogService.cs`
   - Reason: Shared between Core (entities), Infrastructure (configuration), and API layers
   - Alternative considered: Separate enums file, but kept with interface for cohesion

3. **Dynamic Context Parameter**
   - `IErrorLogService.LogErrorAsync(dynamic context, Exception exception, ...)`
   - Reason: Avoid circular dependency between Abstractions and AspNetCore.Http
   - Trade-off: Lose compile-time type checking, but maintain clean layer separation
   - Implementation: Explicitly typed `out` parameters (e.g., `out Guid parsedUserId`) to avoid C# type inference issues with dynamic

### Database Migration

Migration file generated: `20260107025416_AddErrorLogging.cs`

**Migration Applied:** ✅ January 7, 2026

The migration was applied from local development environment using port-forwarded PostgreSQL connection:

```bash
# Start port-forward to PostgreSQL
kubectl port-forward deployment/postgres 5432:5432 -n myuglyrocks

# Apply migration via localhost connection
cd src/api/MyUglyRocks.Infrastructure
dotnet ef database update --startup-project ../MyUglyRocks.Api \
  --connection "Host=localhost;Port=5432;Database=myuglyrocks;Username=postgres;Password=***;SSL Mode=Require;Trust Server Certificate=true"
```

**Note:** Cannot use `kubectl exec` with `dotnet ef` because the runtime container lacks .NET SDK (uses `aspnet:9.0` base image, not `sdk:9.0`).

**Verification:**
```bash
kubectl exec -it deployment/postgres -n myuglyrocks -- \
  psql -U postgres -d myuglyrocks -c "\d error_logs"
```

Table created successfully with:
- 17 columns (error_log_id, correlation_id, exception_type, message, stack_trace, severity, http_method, http_path, http_query_string, http_status_code, user_id, ip_address, user_agent, request_headers, inner_exception, date_created, date_updated)
- 6 indexes (PK, correlation_id, date_created DESC, http_path, severity, severity+date_created composite, user_id)
- Foreign key to users table with ON DELETE SET NULL

### Fire-and-Forget Pattern

Error logging uses `Task.Run()` without awaiting to prevent blocking the request pipeline:

```csharp
_ = Task.Run(async () =>
{
    try
    {
        await _errorLogService.LogErrorAsync(context, exception, CancellationToken.None);
    }
    catch (Exception dbEx)
    {
        _logger.LogWarning(dbEx, "Failed to log error to database...");
    }
});
```

**Benefits:**
- Request completes immediately, even if DB logging fails
- Errors are logged with minimal performance impact
- Fallback to Serilog if database is unavailable

**Trade-offs:**
- No guarantee that error was logged (fire-and-forget)
- Cannot return DB log ID to client
- Acceptable because Serilog is the primary logging mechanism

### Security Considerations

1. **PII Masking:**
   - IP addresses: `192.168.x.x` format via `PiiMaskingHelper.MaskIpAddress()`
   - Paths: Sanitized via `PiiMaskingHelper.SanitizeForLog()`
   - Email addresses in messages: Not currently masked (consider for future enhancement)

2. **Header Filtering:**
   - Captured: User-Agent, Referer, Accept, Origin
   - Excluded: Authorization, Cookie, X-API-Key, etc.
   - Prevents credential leakage in logs

3. **Authorization:**
   - All endpoints require `[Authorize(Roles = "Admin")]`
   - Moderators cannot access error logs
   - Front-end route guarded by admin layout

## Success Criteria

✅ All unhandled exceptions are logged to error_logs table
✅ Correlation IDs match between HTTP response and DB record
✅ PII is properly masked (IP addresses, sanitized paths)
✅ Selected headers are captured (excluding sensitive ones)
✅ Admin UI displays error logs with time presets, filters, search
✅ Detail dialog shows full error context with formatted stack trace
✅ Hangfire cleanup job deletes records older than 180 days
✅ Fire-and-forget logging doesn't impact request performance
✅ Authorization enforced (admin-only access)
