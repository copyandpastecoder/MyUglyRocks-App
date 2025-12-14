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
 * Returns: "Day X of Y", "Due Today", or "X days overdue"
 *
 * Timeline logic:
 * - "Day X of Y": Currently in progress (currentDay < totalDays)
 * - "Due Today": On the last day (currentDay === totalDays) OR slightly past end but same calendar day
 * - "X days overdue": Past the end date by 1+ full days
 */
export function getStageProgressText(
  startDateTime: Date,
  estimateEndDate: Date,
  daysOverdue?: number | null
): string {
  const now = new Date();

  // Calculate total days and current day
  const totalDuration = estimateEndDate.getTime() - startDateTime.getTime();
  const elapsed = now.getTime() - startDateTime.getTime();
  const totalDays = Math.max(1, Math.ceil(totalDuration / (1000 * 60 * 60 * 24)));
  const currentDay = Math.ceil(elapsed / (1000 * 60 * 60 * 24));

  // Check if overdue (past the estimate end date)
  if (estimateEndDate < now) {
    const actualDaysOverdue = daysOverdue ?? Math.floor((now.getTime() - estimateEndDate.getTime()) / (1000 * 60 * 60 * 24));
    if (actualDaysOverdue === 0) {
      return 'Due Today';
    }
    return `${actualDaysOverdue} day${actualDaysOverdue === 1 ? '' : 's'} overdue`;
  }

  // Check if this is the last day of the duration (due today)
  const clampedDay = Math.max(1, Math.min(currentDay, totalDays));
  if (clampedDay === totalDays) {
    return 'Due Today';
  }

  // Still in progress
  return `Day ${clampedDay} of ${totalDays}`;
}
