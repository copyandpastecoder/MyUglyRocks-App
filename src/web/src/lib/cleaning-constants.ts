/**
 * Constants and utilities for cleaning run functionality.
 */

/**
 * Cleaning purpose options matching the backend enum.
 */
export const CLEANING_PURPOSES = [
  { value: 'PostStageClean', label: 'Post-Stage Clean' },
  { value: 'PrePolishClean', label: 'Pre-Polish Clean' },
  { value: 'FinalBurnish', label: 'Final Burnish' },
  { value: 'GritRemoval', label: 'Grit Removal' },
] as const;

/**
 * Duration presets for cleaning runs (in minutes).
 */
export const CLEANING_DURATION_PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1 day', minutes: 1440 },
  { label: '2 days', minutes: 2880 },
] as const;

/**
 * Format a cleaning purpose value to a human-readable label.
 */
export function formatCleaningPurpose(purpose: string): string {
  const purposeMap: Record<string, string> = {
    'PostStageClean': 'Post-Stage Clean',
    'PrePolishClean': 'Pre-Polish Clean',
    'FinalBurnish': 'Final Burnish',
    'GritRemoval': 'Grit Removal',
  };
  return purposeMap[purpose] || purpose;
}
