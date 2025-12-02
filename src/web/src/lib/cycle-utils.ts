/**
 * Get the CSS class for cycle status color based on stage state.
 * Used on dashboard and cycles list for Active cycles.
 *
 * - Red: Cycles with no stages (needs attention)
 * - Amber: Cycles with stages but none active (stalled)
 * - Green: Cycles with active stages (in progress)
 */
export function getCycleStatusClass(cycle: { stageCount: number; activeStageCount: number }): string {
  if (cycle.stageCount === 0) return 'bg-red-500/10 border-red-500/30';
  if (cycle.activeStageCount === 0) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-green-500/10 border-green-500/30';
}
