# Client-Side Error Logging Implementation Plan

## Overview
Implement comprehensive error logging for the Next.js UI to capture all client-side errors and send them to the API for database storage alongside API errors.

## Current State
- ✅ API errors are logged via `GlobalExceptionMiddleware`
- ❌ React component errors are not captured
- ❌ JavaScript runtime errors are not captured
- ❌ Unhandled promise rejections are not captured
- ❌ No client→API error logging mechanism

## Goal
Capture ALL client-side errors and store them in the `error_logs` table with the same structure as API errors.

---

## Implementation Steps

### 1. Backend: API Endpoint for Client Errors

**File**: `src/api/MyUglyRocks.Api/Controllers/ErrorController.cs` (NEW)

**Actions**:
- Create new controller with `[AllowAnonymous]` (errors can occur before login)
- Add `POST /api/errors/log-client-error` endpoint
- Accept `ClientErrorRequest` DTO
- Call `ErrorLogService.LogClientErrorAsync()`
- Return 204 No Content

**DTO**: `src/api/MyUglyRocks.Abstractions/DTOs/ClientErrorRequest.cs` (NEW)
```csharp
public record ClientErrorRequest(
    string Message,
    string? StackTrace,
    string ExceptionType,
    string? ComponentStack, // React component stack
    string Url,
    string UserAgent,
    string? UserId
);
```

**Service Method**: Add to `ErrorLogService`
```csharp
Task LogClientErrorAsync(
    ClientErrorRequest request,
    string ipAddress,
    CancellationToken cancellationToken);
```

**Implementation Details**:
- Extract user ID from JWT if present (optional, since errors may occur pre-auth)
- Set `HttpMethod = "CLIENT"` to distinguish from API errors
- Set `HttpPath = request.Url`
- Set `Severity = ErrorSeverity.Error` (or map based on error type)
- Store `ComponentStack` in `InnerException` field
- Mask IP address using existing `PiiMaskingHelper`

---

### 2. Frontend: Global Error Boundary

**File**: `src/web/src/components/error-boundary.tsx` (NEW)

**Purpose**: Catch React component rendering errors

**Implementation**:
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error service
    errorLogger.logError(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'GlobalErrorBoundary'
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

**Fallback UI**: Simple error screen with:
- "Something went wrong" message
- "Refresh page" button
- Error ID/correlation ID for support
- No technical details (security)

---

### 3. Frontend: Window Error Handlers

**File**: `src/web/src/lib/error-logger.ts` (NEW)

**Purpose**: Catch non-React JavaScript errors and promise rejections

**Implementation**:
```typescript
// Global error handler
window.addEventListener('error', (event) => {
  errorLogger.logError(event.error, {
    type: 'window.onerror',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError(
    new Error(event.reason),
    { type: 'unhandledrejection' }
  );
});
```

**When to Initialize**: In root `layout.tsx` with `useEffect` (client-side only)

---

### 4. Frontend: Error Logging Service

**File**: `src/web/src/lib/error-logger.ts` (NEW)

**Features**:

1. **Deduplication** - Don't send the same error multiple times
   ```typescript
   const recentErrors = new Map<string, number>(); // errorHash → timestamp
   const DEDUPE_WINDOW_MS = 5000; // 5 seconds
   ```

2. **Rate Limiting** - Max 10 errors per minute
   ```typescript
   const errorQueue: Error[] = [];
   const MAX_ERRORS_PER_MINUTE = 10;
   ```

3. **Batching** - Send errors in batches every 2 seconds
   ```typescript
   const errorBatch: ClientErrorRequest[] = [];
   const BATCH_INTERVAL_MS = 2000;
   ```

4. **User Context** - Include user ID if logged in
   ```typescript
   const userId = getUserIdFromToken(); // Extract from access token
   ```

5. **Environment Info**
   - URL: `window.location.href`
   - User Agent: `navigator.userAgent`
   - Viewport: `${window.innerWidth}x${window.innerHeight}`

6. **Error Hash** - For deduplication
   ```typescript
   function hashError(error: Error): string {
     return `${error.name}:${error.message}:${error.stack?.split('\n')[1]}`;
   }
   ```

**API**:
```typescript
export const errorLogger = {
  logError(error: Error, context?: Record<string, any>): void,
  flush(): Promise<void>, // Send queued errors immediately
  clearQueue(): void
};
```

**Service Call**:
```typescript
await api.post('/errors/log-client-error', {
  message: error.message,
  stackTrace: error.stack,
  exceptionType: error.name || 'Error',
  componentStack: context?.componentStack,
  url: window.location.href,
  userAgent: navigator.userAgent,
  userId: getUserIdFromToken()
});
```

---

### 5. Frontend: Integration in Root Layout

**File**: `src/web/src/app/layout.tsx` (MODIFY)

**Changes**:
1. Wrap app in `<ErrorBoundary>`
2. Add `useEffect` to initialize window error handlers
3. Add cleanup on unmount

```typescript
export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize error handlers
    initializeErrorHandlers();

    return () => {
      // Cleanup
      removeErrorHandlers();
    };
  }, []);

  return (
    <html>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

### 6. Frontend: Error Fallback UI

**File**: `src/web/src/components/error-fallback.tsx` (NEW)

**Features**:
- Clean, simple design
- "Something went wrong" message
- "Reload" button
- No stack traces or technical details
- Support link to error logs (for admins)

---

## Error Flow

### React Component Error
```
Component throws error
  → ErrorBoundary.componentDidCatch()
  → errorLogger.logError()
  → Add to batch queue
  → Every 2s: POST /api/errors/log-client-error
  → ErrorController receives request
  → ErrorLogService.LogClientErrorAsync()
  → Save to error_logs table
```

### JavaScript Runtime Error
```
Uncaught error in JS
  → window.addEventListener('error')
  → errorLogger.logError()
  → [same as above]
```

### Unhandled Promise Rejection
```
Promise.reject() without .catch()
  → window.addEventListener('unhandledrejection')
  → errorLogger.logError()
  → [same as above]
```

---

## Database Schema

**No changes needed** - Uses existing `error_logs` table:

```sql
CREATE TABLE error_logs (
  error_log_id UUID PRIMARY KEY,
  correlation_id VARCHAR(100),     -- Generated client-side
  exception_type VARCHAR(200),      -- error.name (e.g., "TypeError")
  message TEXT,                     -- error.message
  stack_trace TEXT,                 -- error.stack
  severity VARCHAR(20),             -- "Error"
  http_method VARCHAR(10),          -- "CLIENT"
  http_path TEXT,                   -- window.location.href
  user_id UUID,                     -- Extracted from JWT (nullable)
  ip_address VARCHAR(50),           -- Masked on server
  user_agent TEXT,                  -- navigator.userAgent
  request_headers JSONB,            -- NULL for client errors
  inner_exception TEXT,             -- React componentStack
  date_created TIMESTAMP,
  date_updated TIMESTAMP
);
```

**Distinguishing Client vs API Errors**:
- `http_method = 'CLIENT'` → Client-side error
- `http_method = 'GET/POST/PUT/etc.'` → API error

---

## Security Considerations

1. **Rate Limiting** - Max 10 errors/minute per client prevents DoS
2. **PII Masking** - IP addresses masked server-side
3. **No Sensitive Data** - Never send localStorage, cookies, or tokens in error logs
4. **Anonymous Allowed** - Endpoint is `[AllowAnonymous]` so pre-login errors are captured
5. **Stack Trace Sanitization** - Remove any file paths that might expose internal structure
6. **CORS** - Endpoint must be accessible from web origin

---

## Testing Plan

### Unit Tests
- [ ] ErrorLogService.LogClientErrorAsync() saves to database
- [ ] Client error DTO validation
- [ ] Error deduplication logic
- [ ] Error batching logic
- [ ] Rate limiting logic

### Integration Tests
- [ ] POST /api/errors/log-client-error returns 204
- [ ] Client errors appear in error_logs table with `http_method = 'CLIENT'`
- [ ] IP addresses are masked
- [ ] User ID extracted from JWT when present

### Manual E2E Tests
- [ ] Throw error in React component → appears in error_logs
- [ ] Trigger `window.onerror` → appears in error_logs
- [ ] Trigger unhandled promise rejection → appears in error_logs
- [ ] Error boundary shows fallback UI
- [ ] Multiple identical errors deduplicated (only 1 entry)
- [ ] Errors while logged out still captured (no user_id)
- [ ] Errors while logged in include user_id
- [ ] Admin can view client errors in `/admin/error-logs`
- [ ] Client errors filterable by `http_method = 'CLIENT'`

---

## Rollout Plan

### Phase 1: Backend (Non-Breaking)
1. Create `ErrorController` with client error endpoint
2. Add `LogClientErrorAsync` method to `ErrorLogService`
3. Deploy to staging
4. Test endpoint with Postman/curl

### Phase 2: Frontend (Progressive Enhancement)
1. Create `error-logger.ts` service
2. Create `ErrorBoundary` component
3. Create `ErrorFallback` component
4. Integrate in `layout.tsx`
5. Deploy to staging
6. Trigger test errors, verify they appear in error_logs

### Phase 3: Production
1. Deploy backend + frontend together
2. Monitor error_logs for spike in entries
3. Review client errors in admin panel
4. Adjust rate limits/deduplication if needed

---

## Success Criteria

- ✅ All React component errors captured in database
- ✅ All JavaScript runtime errors captured in database
- ✅ All unhandled promise rejections captured in database
- ✅ Client errors viewable in admin panel
- ✅ No duplicate errors from same source within 5 seconds
- ✅ Rate limiting prevents error spam
- ✅ Error boundary shows user-friendly fallback UI
- ✅ No PII exposed in error logs
- ✅ Errors captured before user login (anonymous)
- ✅ User ID associated with errors after login

---

## Future Enhancements

- [ ] Source map support for production error stack traces
- [ ] Error grouping/aggregation in admin UI
- [ ] Email alerts for critical errors
- [ ] Error trend graphs (errors per day/week)
- [ ] Integration with external error tracking (Sentry, Rollbar)
- [ ] Capture browser console logs with errors
- [ ] Capture network requests that failed before error
- [ ] Session replay for error reproduction
