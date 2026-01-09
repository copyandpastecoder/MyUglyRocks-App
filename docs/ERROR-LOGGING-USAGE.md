# Error Logging Usage Guide

## Overview

The error logging system captures both uncaught errors and manually logged errors, storing them in the `error_logs` database table for analysis.

## System Architecture

### Frontend (TypeScript)
- **Location**: `src/web/src/lib/error-logger.ts`
- **Global handlers**: Automatically catches uncaught errors and unhandled promise rejections
- **Rate limiting**: Max 10 errors per minute to prevent flooding
- **Deduplication**: Same error within 5 seconds is ignored
- **Batching**: Errors are sent every 2 seconds to reduce network requests

### Backend (C#)
- **Controller**: `src/api/MyUglyRocks.Api/Controllers/ErrorController.cs`
- **Service**: `src/api/MyUglyRocks.Core/Services/ErrorLogService.cs`
- **Endpoint**: `POST /api/errors/log-client-error` (AllowAnonymous)
- **Table**: `error_logs` in PostgreSQL

## When Errors Are Logged

### ✅ Automatically Logged
1. **Uncaught JavaScript errors** - Any error not caught by try-catch
2. **Unhandled promise rejections** - Promises that reject without .catch()
3. **React Error Boundaries** - Component rendering errors caught by ErrorBoundary

### ❌ NOT Automatically Logged
1. **Caught errors in try-catch blocks** - These need manual logging
2. **API errors shown as toast messages** - These are caught by React Query
3. **Validation errors** - Handled gracefully by forms

## How to Manually Log Errors

### Import the logger
```typescript
import { logCaughtError } from '@/lib/error-logger';
```

### In try-catch blocks
```typescript
try {
  await someRiskyOperation();
} catch (error) {
  // Show user-friendly message
  toast.error('Failed to save');
  
  // Also log to database for debugging
  logCaughtError(error, {
    type: 'save-operation-failed',
    // Add any additional context
  });
}
```

### In React Query error handlers
```typescript
const mutation = useMutation({
  mutationFn: apiCall,
  onError: (error) => {
    const axiosError = error as { response?: { data?: { message?: string } } };
    toast.error(axiosError.response?.data?.message || 'Failed');
    
    // Log for debugging
    logCaughtError(error, {
      type: 'api-mutation-error',
    });
  },
});
```

## Development Mode Debugging

In development, the error logger outputs to console:
```
[ErrorLogger] Logging error: <message>
[ErrorLogger] Error queued, queue size: 1
[ErrorLogger] Sending error to server: <payload>
[ErrorLogger] Error sent successfully
```

If you see errors NOT being logged, check for:
- `[ErrorLogger] Rate limit exceeded` - Too many errors too quickly
- `[ErrorLogger] Duplicate error within dedup window` - Same error repeated
- No output at all - Error is being caught and not logged

## Viewing Logged Errors

### Via Database
```bash
kubectl exec -it -n myuglyrocks <postgres-pod> -- psql -U postgres -d myuglyrocks
```

```sql
-- View recent errors
SELECT 
  date_created,
  exception_type,
  message,
  http_path as url,
  user_id
FROM error_logs
ORDER BY date_created DESC
LIMIT 20;

-- Count errors by type
SELECT 
  exception_type,
  COUNT(*) as count
FROM error_logs
GROUP BY exception_type
ORDER BY count DESC;

-- Errors by user
SELECT 
  user_id,
  COUNT(*) as error_count
FROM error_logs
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY error_count DESC;
```

### Common Benign Errors

Some errors are expected and can be filtered:
- `ResizeObserver loop completed with undelivered notifications` - Browser optimization, not a real issue
- Chart.js resize events - Normal during responsive layout changes

## Rate Limits and Safeguards

- **Max errors per minute**: 10
- **Deduplication window**: 5 seconds
- **Batch interval**: 2 seconds
- **Max queue size**: 50 errors

These limits prevent:
- Infinite error loops
- Database flooding
- Network spam

## Best Practices

1. **Log critical errors** - Always log errors that indicate bugs
2. **Don't log validation errors** - These are expected user behavior
3. **Add context** - Include operation type, component name, etc.
4. **User-friendly first** - Show toast message, then log
5. **Test in dev mode** - Check console to verify logging works

## Example: Adding Error Logging to a Component

```typescript
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logCaughtError } from '@/lib/error-logger';
import { cycleApi } from '@/lib/api';

function MyCycleComponent() {
  const createMutation = useMutation({
    mutationFn: cycleApi.createCycle,
    onSuccess: () => {
      toast.success('Cycle created');
    },
    onError: (error) => {
      // User-friendly message
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to create cycle');
      
      // Log for debugging
      logCaughtError(error, {
        type: 'cycle-creation-failed',
      });
    },
  });

  return (
    // Component JSX
  );
}
```

## Troubleshooting

### No errors in error_logs table
1. Check that `ErrorHandlerProvider` is in root layout ✓ (already present)
2. Verify errors are actually occurring (check browser console)
3. Check that errors aren't being caught and handled without logging
4. Confirm network requests to `/api/errors/log-client-error` in DevTools

### Too many errors logged
1. Check for error loops (error in error handler)
2. Verify deduplication is working
3. Consider filtering benign errors at database level

### Errors not showing in production
1. Verify `initializeErrorHandlers()` is called
2. Check that API endpoint is accessible
3. Verify database connection in backend
4. Check Serilog logs for "Failed to log client error"
