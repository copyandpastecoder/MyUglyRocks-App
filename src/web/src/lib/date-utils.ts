/**
 * Date utility functions for consistent date handling across the application.
 */

/**
 * Format a Date object for datetime-local input (YYYY-MM-DDTHH:MM)
 */
export function formatDateTimeLocal(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Combine a date string (YYYY-MM-DD) with current time.
 * This avoids UTC timezone issues when parsing date-only strings.
 */
export function combineDateWithCurrentTime(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const now = new Date();
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes());
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
 * Calculate duration between two dates in days and hours.
 */
export function calculateDurationFromDates(startDate: Date, endDate: Date): { days: number; hours: number } {
  const durationMs = endDate.getTime() - startDate.getTime();
  const totalHours = Math.round(durationMs / (1000 * 60 * 60));
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  };
}
