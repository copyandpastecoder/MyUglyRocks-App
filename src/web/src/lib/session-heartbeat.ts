import { api } from './api';

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let currentSessionId: string | null = null;

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start sending heartbeats for the given session.
 * Heartbeats are only sent when the tab is visible.
 */
export function startSessionHeartbeat(sessionId: string): void {
  // If already running for this session, do nothing
  if (heartbeatInterval && currentSessionId === sessionId) {
    return;
  }

  // Stop any existing heartbeat
  stopSessionHeartbeat();

  currentSessionId = sessionId;

  // Send initial heartbeat
  sendHeartbeat();

  // Set up interval
  heartbeatInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  }, HEARTBEAT_INTERVAL_MS);
}

/**
 * Stop sending heartbeats
 */
export function stopSessionHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  currentSessionId = null;
}

/**
 * Send a single heartbeat to the server
 */
async function sendHeartbeat(): Promise<void> {
  if (!currentSessionId) return;

  try {
    await api.post(`/session/heartbeat/${currentSessionId}`);
  } catch (error) {
    // Silently fail - heartbeats are not critical
    console.debug('Failed to send session heartbeat:', error);
  }
}

/**
 * Send a page view event for the current session
 */
export async function recordPageView(): Promise<void> {
  if (!currentSessionId) return;

  try {
    await api.post(`/session/pageview/${currentSessionId}`);
  } catch (error) {
    // Silently fail - page views are not critical
    console.debug('Failed to record page view:', error);
  }
}

/**
 * End the current session (called on logout)
 */
export async function endSession(): Promise<void> {
  if (!currentSessionId) return;

  try {
    await api.post(`/session/end/${currentSessionId}`);
  } catch (error) {
    // Silently fail
    console.debug('Failed to end session:', error);
  } finally {
    stopSessionHeartbeat();
  }
}

/**
 * Get the current session ID
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}
