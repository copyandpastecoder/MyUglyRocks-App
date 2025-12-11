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
