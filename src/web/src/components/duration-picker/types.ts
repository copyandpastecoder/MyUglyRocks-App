export interface DurationPickerProps {
  durationDays: string;
  durationHours: string;
  durationMinutes?: string;
  onDaysChange: (value: string) => void;
  onHoursChange: (value: string) => void;
  onMinutesChange?: (value: string) => void;
  startDateTime?: string;
  label?: string;
  helperText?: string;
  hideLabel?: boolean;
}

export const DURATION_PRESETS = [1, 2, 3, 5, 7, 10];
