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
 * Get progress text for an active stage based on timing.
 * Returns: "Day X of Y", "Due Today", "Due Tomorrow", or "X days overdue"
 *
 * Timeline logic:
 * - "Day X of Y": Currently in progress, end date is 2+ days away
 * - "Due Tomorrow": End date is tomorrow (calendar day)
 * - "Due Today": End date is today (calendar day)
 * - "X days overdue": Past the end date by 1+ full calendar days
 */
export function getStageProgressText(
  startDateTime: Date,
  estimateEndDate: Date,
  daysOverdue?: number | null
): string {
  const now = new Date();

  // Compare calendar dates (in local timezone)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = new Date(estimateEndDate.getFullYear(), estimateEndDate.getMonth(), estimateEndDate.getDate());
  const startDay = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilEnd = Math.round((endDay.getTime() - today.getTime()) / msPerDay);
  const totalDays = Math.max(1, Math.round((endDay.getTime() - startDay.getTime()) / msPerDay));

  // Check overdue (end date is in the past)
  if (daysUntilEnd < 0) {
    const actualDaysOverdue = daysOverdue ?? Math.abs(daysUntilEnd);
    return `${actualDaysOverdue} day${actualDaysOverdue === 1 ? '' : 's'} overdue`;
  }

  // Due today
  if (daysUntilEnd === 0) {
    return 'Due Today';
  }

  // Due tomorrow
  if (daysUntilEnd === 1) {
    return 'Due Tomorrow';
  }

  // Still in progress - calculate current day
  const daysSinceStart = Math.round((today.getTime() - startDay.getTime()) / msPerDay);
  const currentDay = Math.max(1, Math.min(daysSinceStart + 1, totalDays));

  return `Day ${currentDay} of ${totalDays}`;
}
