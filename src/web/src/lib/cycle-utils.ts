/**
 * Get the CSS class for cycle status color based on stage state.
 * Used on dashboard and cycles list for Active cycles.
 *
 * - Red: Cycles with no stages (needs attention)
 * - Amber: Cycles with stages but none active (stalled)
 * - Yellow: Cycles with overdue stages (ready to complete)
 * - Green: Cycles with active stages (in progress)
 */
export function getCycleStatusClass(cycle: { stageCount: number; activeStageCount: number; isOverdue?: boolean }): string {
  if (cycle.stageCount === 0) return 'bg-red-500/10 border-red-500/30';
  if (cycle.activeStageCount === 0) return 'bg-amber-500/10 border-amber-500/30';
  if (cycle.isOverdue) return 'bg-yellow-500/10 border-yellow-300';
  return 'bg-green-500/10 border-green-500/30';
}

/**
 * Format stage display name with run number.
 * Shows "Run X" only when there are multiple runs of the same stage type.
 */
export function formatStageDisplayName(stageName: string, runNumber: number, totalRuns: number): string {
  if (totalRuns <= 1) {
    return stageName;
  }
  return `${stageName} Run ${runNumber}`;
}

/**
 * Timing information for a stage run.
 */
export interface StageTiming {
  /** Days until end date (negative if overdue) */
  daysUntilEnd: number;
  /** Total duration in days */
  totalDays: number;
  /** Current day number (1-indexed) */
  currentDay: number;
  /** Progress percentage (0-100, can exceed 100 if overdue) */
  progressPercent: number;
  /** Whether the stage is overdue */
  isOverdue: boolean;
}

/**
 * Calculate timing information for a stage run.
 * Uses calendar days for day calculations.
 * Uses precise milliseconds for progress percentage.
 *
 * @param startDateTime - Stage start date (should be in user's timezone)
 * @param estimateEndDate - Stage end date (should be in user's timezone)
 * @param now - Current time in user's timezone (defaults to browser local time)
 */
export function getStageTiming(startDateTime: Date, estimateEndDate: Date, now?: Date): StageTiming {
  const currentTime = now ?? new Date();

  // Calendar dates for day-based calculations
  const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
  const endDay = new Date(estimateEndDate.getFullYear(), estimateEndDate.getMonth(), estimateEndDate.getDate());
  const startDay = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilEnd = Math.round((endDay.getTime() - today.getTime()) / msPerDay);
  const totalDays = Math.max(1, Math.round((endDay.getTime() - startDay.getTime()) / msPerDay));
  const daysSinceStart = Math.round((today.getTime() - startDay.getTime()) / msPerDay);
  const currentDay = Math.max(1, Math.min(daysSinceStart + 1, totalDays));

  // Precise progress percentage using actual timestamps
  const totalDuration = estimateEndDate.getTime() - startDateTime.getTime();
  const elapsed = currentTime.getTime() - startDateTime.getTime();
  const progressPercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  return {
    daysUntilEnd,
    totalDays,
    currentDay,
    progressPercent,
    isOverdue: daysUntilEnd < 0,
  };
}

/**
 * Get progress text for an active stage based on timing.
 * Returns: "Day X of Y", "Due Today", "Due Tomorrow", or "X days overdue"
 *
 * Timeline logic:
 * - "Day X of Y": Currently in progress, end date is 2+ days away
 * - "Due Tomorrow": End date is tomorrow (calendar day)
 * - "Due Today": End date is today (calendar day)
 * - "X days overdue": Past the end date by 1+ full calendar days
 *
 * @param startDateTime - Stage start date (should be in user's timezone)
 * @param estimateEndDate - Stage end date (should be in user's timezone)
 * @param daysOverdue - Optional pre-calculated days overdue from API
 * @param now - Current time in user's timezone (defaults to browser local time)
 */
export function getStageProgressText(
  startDateTime: Date,
  estimateEndDate: Date,
  daysOverdue?: number | null,
  now?: Date
): string {
  const timing = getStageTiming(startDateTime, estimateEndDate, now);

  // Check overdue (end date is in the past)
  if (timing.isOverdue) {
    const actualDaysOverdue = daysOverdue ?? Math.abs(timing.daysUntilEnd);
    return `${actualDaysOverdue} day${actualDaysOverdue === 1 ? '' : 's'} overdue`;
  }

  // Due today
  if (timing.daysUntilEnd === 0) {
    return 'Due Today';
  }

  // Due tomorrow
  if (timing.daysUntilEnd === 1) {
    return 'Due Tomorrow';
  }

  // Still in progress
  return `Day ${timing.currentDay} of ${timing.totalDays}`;
}
