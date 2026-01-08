import { api, getAccessToken } from './api';

interface ErrorContext {
  componentStack?: string;
  type?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  [key: string]: any;
}

interface ClientErrorRequest {
  message: string;
  stackTrace: string | null;
  exceptionType: string;
  componentStack: string | null;
  url: string;
  userAgent: string;
  userId: string | null;
}

class ErrorLogger {
  private recentErrors = new Map<string, number>();
  private errorQueue: Array<{ error: Error; context?: ErrorContext }> = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private errorCount = 0;
  private errorCountResetTime = Date.now();

  private readonly DEDUPE_WINDOW_MS = 5000; // 5 seconds
  private readonly BATCH_INTERVAL_MS = 2000; // 2 seconds
  private readonly MAX_ERRORS_PER_MINUTE = 10;
  private readonly MAX_QUEUE_SIZE = 50;

  /**
   * Log an error to the server
   */
  public logError(error: Error, context?: ErrorContext): void {
    // Only log in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      console.warn('Error logging rate limit exceeded, dropping error:', error.message);
      return;
    }

    // Check for duplicate errors
    const errorHash = this.hashError(error);
    const now = Date.now();
    const lastSeen = this.recentErrors.get(errorHash);

    if (lastSeen && now - lastSeen < this.DEDUPE_WINDOW_MS) {
      // Duplicate error within deduplication window, skip
      return;
    }

    // Mark error as seen
    this.recentErrors.set(errorHash, now);

    // Add to queue
    this.errorQueue.push({ error, context });

    // Limit queue size
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift(); // Remove oldest error
    }

    // Schedule flush
    this.scheduleFlush();

    // Cleanup old entries from deduplication map
    this.cleanupDedupeMap();
  }

  /**
   * Send all queued errors immediately
   */
  public async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.errorQueue.length === 0) {
      return;
    }

    const batch = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await Promise.all(
        batch.map(({ error, context }) => this.sendError(error, context))
      );
    } catch (err) {
      console.error('Failed to flush error logs:', err);
    }
  }

  /**
   * Clear the error queue without sending
   */
  public clearQueue(): void {
    this.errorQueue = [];
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Send a single error to the server
   */
  private async sendError(error: Error, context?: ErrorContext): Promise<void> {
    try {
      const payload: ClientErrorRequest = {
        message: error.message || 'Unknown error',
        stackTrace: error.stack || null,
        exceptionType: error.name || 'Error',
        componentStack: context?.componentStack || null,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        userId: this.getUserId(),
      };

      await api.post('/errors/log-client-error', payload);
    } catch (err) {
      // Silently fail to avoid infinite error loops
      console.error('Failed to send error to server:', err);
    }
  }

  /**
   * Extract user ID from JWT access token
   */
  private getUserId(): string | null {
    try {
      const token = getAccessToken();
      if (!token) {
        return null;
      }

      // Decode JWT payload (second part of token)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      try {
        const payload = JSON.parse(atob(parts[1]));
        // Look for user ID claim (common claim names)
        return payload.sub || payload.userId || payload.nameid || null;
      } catch {
        // Malformed token
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Generate a hash for error deduplication
   */
  private hashError(error: Error): string {
    const firstStackLine = error.stack?.split('\n')[1] || '';
    return `${error.name}:${error.message}:${firstStackLine}`;
  }

  /**
   * Check if we're within rate limit
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset counter if more than 1 minute has passed
    if (now - this.errorCountResetTime > 60000) {
      this.errorCount = 0;
      this.errorCountResetTime = now;
    }

    // Check if we're over the limit
    if (this.errorCount >= this.MAX_ERRORS_PER_MINUTE) {
      return false;
    }

    this.errorCount++;
    return true;
  }

  /**
   * Schedule a flush of the error queue
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return; // Already scheduled
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.BATCH_INTERVAL_MS);
  }

  /**
   * Clean up old entries from deduplication map
   */
  private cleanupDedupeMap(): void {
    const now = Date.now();
    const cutoff = now - this.DEDUPE_WINDOW_MS;

    for (const [hash, timestamp] of this.recentErrors.entries()) {
      if (timestamp < cutoff) {
        this.recentErrors.delete(hash);
      }
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Initialize global error handlers
 */
export function initializeErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    errorLogger.logError(event.error || new Error(event.message), {
      type: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    errorLogger.logError(error, {
      type: 'unhandledrejection',
    });
  });

  // Flush errors before page unload
  window.addEventListener('beforeunload', () => {
    errorLogger.flush();
  });
}

/**
 * Remove global error handlers (for cleanup)
 */
export function removeErrorHandlers(): void {
  // Note: Can't remove specific handlers without references
  // This is primarily for documentation purposes
}
