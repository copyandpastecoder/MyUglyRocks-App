/**
 * Date utility functions for consistent date handling across the application.
 *
 * TIMEZONE STRATEGY:
 * - Database stores all DateTimes in UTC
 * - API returns UTC ISO strings
 * - Frontend converts UTC to user's timezone for display
 * - Frontend converts user's timezone to UTC before sending to API
 */

import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

// Default timezone fallback (used when user settings not available)
const DEFAULT_TIMEZONE = 'UTC';

// ============================================================================
// TIMEZONE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert a UTC date string (from API) to user's timezone.
 * Use this when displaying dates from the API.
 *
 * @param utcDateString - ISO date string in UTC from API (e.g., "2024-01-15T10:30:00Z")
 * @param timezone - User's timezone (e.g., "America/New_York")
 * @returns Date object representing the same instant in user's timezone
 */
export function utcToUserTimezone(utcDateString: string | null | undefined, timezone: string = DEFAULT_TIMEZONE): Date | null {
  if (!utcDateString) return null;
  try {
    const utcDate = new Date(utcDateString);
    return toZonedTime(utcDate, timezone);
  } catch {
    console.error('Failed to convert UTC to user timezone:', utcDateString);
    return new Date(utcDateString);
  }
}

/**
 * Convert a local date (from user input) to UTC for API submission.
 * Use this when sending dates to the API.
 *
 * @param localDate - Date object in user's local timezone
 * @param timezone - User's timezone (e.g., "America/New_York")
 * @returns ISO string in UTC for API submission
 */
export function userTimezoneToUtc(localDate: Date, timezone: string = DEFAULT_TIMEZONE): string {
  try {
    const utcDate = fromZonedTime(localDate, timezone);
    return utcDate.toISOString();
  } catch {
    console.error('Failed to convert user timezone to UTC:', localDate);
    return localDate.toISOString();
  }
}

/**
 * Get current time in user's timezone.
 * Use this instead of new Date() when you need "now" in user's perspective.
 *
 * @param timezone - User's timezone (e.g., "America/New_York")
 * @returns Date object representing current time in user's timezone
 */
export function getNowInTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Format a UTC date string for display in user's timezone.
 *
 * @param utcDateString - ISO date string in UTC from API
 * @param timezone - User's timezone
 * @param formatStr - date-fns format string (e.g., "MMM d, yyyy h:mm a")
 * @returns Formatted date string
 */
export function formatInTimezone(
  utcDateString: string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  if (!utcDateString) return '';
  try {
    const utcDate = new Date(utcDateString);
    return formatTz(utcDate, formatStr, { timeZone: timezone });
  } catch {
    console.error('Failed to format date in timezone:', utcDateString);
    return utcDateString;
  }
}

/**
 * Check if a UTC date is "today" in the user's timezone.
 *
 * @param utcDateString - ISO date string in UTC
 * @param timezone - User's timezone
 * @returns true if the date is today in user's timezone
 */
export function isDateTodayInTimezone(utcDateString: string | null | undefined, timezone: string = DEFAULT_TIMEZONE): boolean {
  if (!utcDateString) return false;
  try {
    const dateInTz = utcToUserTimezone(utcDateString, timezone);
    const nowInTz = getNowInTimezone(timezone);
    if (!dateInTz) return false;
    return dateInTz.toDateString() === nowInTz.toDateString();
  } catch {
    return false;
  }
}

// ============================================================================
// DATETIME-LOCAL INPUT HELPERS
// ============================================================================

/**
 * Format a Date object for datetime-local input (YYYY-MM-DDTHH:MM).
 * The date should already be in the user's timezone.
 */
export function formatDateTimeLocal(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Format a UTC date string for datetime-local input in user's timezone.
 * Use this to pre-populate datetime-local inputs with API data.
 *
 * @param utcDateString - ISO date string in UTC from API
 * @param timezone - User's timezone
 * @returns String formatted for datetime-local input (YYYY-MM-DDTHH:MM)
 */
export function formatUtcForDateTimeLocalInput(utcDateString: string | null | undefined, timezone: string = DEFAULT_TIMEZONE): string {
  if (!utcDateString) return '';
  const dateInTz = utcToUserTimezone(utcDateString, timezone);
  return formatDateTimeLocal(dateInTz);
}

/**
 * Parse datetime-local input value and convert to UTC ISO string.
 * Use this when submitting datetime-local input values to the API.
 *
 * @param dateTimeLocalValue - Value from datetime-local input (YYYY-MM-DDTHH:MM)
 * @param timezone - User's timezone
 * @returns UTC ISO string for API submission
 */
export function parseDateTimeLocalToUtc(dateTimeLocalValue: string, timezone: string = DEFAULT_TIMEZONE): string {
  if (!dateTimeLocalValue) return '';
  // datetime-local gives us a string like "2024-01-15T10:30"
  // We need to interpret this as being in the user's timezone
  const localDate = new Date(dateTimeLocalValue);
  return userTimezoneToUtc(localDate, timezone);
}

// ============================================================================
// LEGACY/UTILITY FUNCTIONS
// ============================================================================

/**
 * Combine a date string (YYYY-MM-DD) with current time in user's timezone.
 *
 * @param dateStr - Date string (YYYY-MM-DD)
 * @param timezone - User's timezone
 * @returns Date object with combined date and current time
 */
export function combineDateWithCurrentTime(dateStr: string, timezone: string = DEFAULT_TIMEZONE): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const nowInTz = getNowInTimezone(timezone);
  return new Date(year, month - 1, day, nowInTz.getHours(), nowInTz.getMinutes());
}

/**
 * Check if a stage start date is before the cycle start date.
 * Compares dates only (ignores time).
 */
export function isStageStartBeforeCycleStart(cycleStartDate: string, stageStartDateTime: string): boolean {
  const cycleDate = new Date(cycleStartDate);
  const stageDate = new Date(stageStartDateTime);
  cycleDate.setHours(0, 0, 0, 0);
  stageDate.setHours(0, 0, 0, 0);
  return stageDate < cycleDate;
}

/**
 * Calculate duration between two dates in days, hours, and minutes.
 */
export function calculateDurationFromDates(startDate: Date, endDate: Date): { days: number; hours: number; minutes: number } {
  const durationMs = endDate.getTime() - startDate.getTime();
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
  };
}
