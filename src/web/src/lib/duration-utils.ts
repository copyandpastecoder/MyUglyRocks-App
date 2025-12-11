/**
 * Duration utility functions for converting between different time representations.
 */

/**
 * Convert total minutes to days, hours, and minutes.
 */
export function convertMinutesToDaysHoursMinutes(minutes: number): {
  days: number;
  hours: number;
  mins: number;
} {
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    mins: minutes % 60,
  };
}

/**
 * Convert days, hours, and minutes to total minutes.
 */
export function convertDaysHoursMinutesToMinutes(days: number, hours: number, mins: number): number {
  return days * 1440 + hours * 60 + mins;
}

/**
 * Format duration in minutes to a human-readable string (e.g., "2d 3h 15m").
 */
export function formatDurationMinutes(minutes: number): string {
  const { days, hours, mins } = convertMinutesToDaysHoursMinutes(minutes);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

  return parts.join(' ');
}
