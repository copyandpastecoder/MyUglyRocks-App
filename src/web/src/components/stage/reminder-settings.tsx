'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface ReminderData {
  enabled: boolean;
  type: 'afterDays' | 'atEnd';
  afterDays: string;
}

interface ReminderSettingsProps {
  data: ReminderData;
  onChange: (data: ReminderData) => void;
}

export function ReminderSettings({
  data,
  onChange,
}: ReminderSettingsProps) {
  const updateField = <K extends keyof ReminderData>(field: K, value: ReminderData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="reminderEnabled"
          checked={data.enabled}
          onCheckedChange={(checked) => updateField('enabled', checked as boolean)}
        />
        <Label htmlFor="reminderEnabled">Set a reminder to check this stage</Label>
      </div>
      {data.enabled && (
        <div className="ml-6 space-y-2">
          <RadioGroup value={data.type} onValueChange={(v) => updateField('type', v as 'afterDays' | 'atEnd')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="afterDays" id="afterDays" />
              <Label htmlFor="afterDays" className="flex items-center gap-2">
                Remind after
                <Input
                  type="number"
                  min="1"
                  className="w-16 h-8"
                  value={data.afterDays}
                  onChange={(e) => updateField('afterDays', e.target.value)}
                  disabled={data.type !== 'afterDays'}
                />
                days from start
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="atEnd" id="atEnd" />
              <Label htmlFor="atEnd">Remind at end of stage</Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
