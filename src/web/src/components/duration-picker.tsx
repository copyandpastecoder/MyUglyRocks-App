'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTimeLocal, calculateDurationFromDates } from '@/lib/date-utils';

const DURATION_PRESETS = [1, 2, 3, 5, 7, 10];

interface DurationPickerProps {
  durationDays: string;
  durationHours: string;
  onDaysChange: (value: string) => void;
  onHoursChange: (value: string) => void;
  startDateTime?: string;
  label?: string;
  helperText?: string;
  hideLabel?: boolean;
}

export function DurationPicker({
  durationDays,
  durationHours,
  onDaysChange,
  onHoursChange,
  startDateTime,
  label = 'Duration',
  helperText,
  hideLabel = false,
}: DurationPickerProps) {
  const showEndDatePicker = !!startDateTime;

  const calculateEndDate = () => {
    if (!startDateTime) return null;
    const start = new Date(startDateTime);
    const days = parseInt(durationDays) || 0;
    const hours = parseInt(durationHours) || 0;
    return new Date(start.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
  };

  // When user picks an end date, calculate and update duration
  const handleEndDateChange = (endDateStr: string) => {
    if (!startDateTime || !endDateStr) return;

    const start = new Date(startDateTime);
    const end = new Date(endDateStr);

    // Don't allow end date before start date
    if (end <= start) {
      onDaysChange('0');
      onHoursChange('1');
      return;
    }

    const { days, hours } = calculateDurationFromDates(start, end);
    onDaysChange(String(days));
    onHoursChange(String(hours));
  };

  const endDate = calculateEndDate();

  return (
    <div className="space-y-2">
      {!hideLabel && <Label>{label}</Label>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Days</Label>
          <Input
            type="number"
            min="0"
            value={durationDays}
            onChange={(e) => onDaysChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hours</Label>
          <Input
            type="number"
            min="0"
            max="23"
            value={durationHours}
            onChange={(e) => onHoursChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {DURATION_PRESETS.map(days => (
          <Button
            key={days}
            type="button"
            variant={durationDays === String(days) && durationHours === '0' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onDaysChange(String(days));
              onHoursChange('0');
            }}
          >
            {days}d
          </Button>
        ))}
      </div>
      {showEndDatePicker && (
        <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
          <Label className="text-xs text-muted-foreground">End Date</Label>
          <Input
            type="datetime-local"
            value={formatDateTimeLocal(endDate)}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={startDateTime}
          />
        </div>
      )}
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
