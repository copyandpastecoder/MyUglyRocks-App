'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTimeLocal, calculateDurationFromDates } from '@/lib/date-utils';
import type { DurationPickerProps } from './types';
import { DURATION_PRESETS } from './types';

export function DurationPickerMobile({
  durationDays,
  durationHours,
  durationMinutes = '0',
  onDaysChange,
  onHoursChange,
  onMinutesChange,
  startDateTime,
  label = 'Duration',
  helperText,
  hideLabel = false,
}: DurationPickerProps) {
  const showEndDatePicker = !!startDateTime;
  const showMinutes = !!onMinutesChange;

  const calculateEndDate = () => {
    if (!startDateTime) return null;
    const start = new Date(startDateTime);
    const days = parseInt(durationDays) || 0;
    const hours = parseInt(durationHours) || 0;
    const minutes = parseInt(durationMinutes) || 0;
    return new Date(start.getTime() + ((days * 24 + hours) * 60 + minutes) * 60 * 1000);
  };

  const handleEndDateChange = (endDateStr: string) => {
    if (!startDateTime || !endDateStr) return;

    const start = new Date(startDateTime);
    const end = new Date(endDateStr);

    if (end <= start) {
      onDaysChange('0');
      onHoursChange('1');
      onMinutesChange?.('0');
      return;
    }

    const { days, hours, minutes } = calculateDurationFromDates(start, end);
    onDaysChange(String(days));
    onHoursChange(String(hours));
    onMinutesChange?.(String(minutes));
  };

  const endDate = calculateEndDate();

  return (
    <div className="space-y-3">
      {!hideLabel && <Label className="text-base font-semibold">{label}</Label>}
      <div className={`grid gap-3 ${showMinutes ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">Days</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            value={durationDays}
            onChange={(e) => onDaysChange(e.target.value)}
            className="h-12 text-base text-center"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">Hours</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            max="23"
            value={durationHours}
            onChange={(e) => onHoursChange(e.target.value)}
            className="h-12 text-base text-center"
          />
        </div>
        {showMinutes && (
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Minutes</Label>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              value={durationMinutes}
              onChange={(e) => onMinutesChange?.(e.target.value)}
              className="h-12 text-base text-center"
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map(days => (
          <Button
            key={days}
            type="button"
            variant={durationDays === String(days) && durationHours === '0' && (!showMinutes || durationMinutes === '0') ? 'default' : 'outline'}
            className="min-h-[44px] min-w-[44px] text-base"
            onClick={() => {
              onDaysChange(String(days));
              onHoursChange('0');
              onMinutesChange?.('0');
            }}
          >
            {days}d
          </Button>
        ))}
      </div>
      {showEndDatePicker && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <Label className="text-sm text-muted-foreground">End Date</Label>
          <Input
            type="datetime-local"
            value={formatDateTimeLocal(endDate)}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={startDateTime}
            className="h-12 text-base"
          />
        </div>
      )}
      {helperText && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
