'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Sparkles } from 'lucide-react';
import { StageMaterialsSection, type StageMaterial } from './stage-materials-section';
import { CLEANING_PURPOSES, CLEANING_DURATION_PRESETS } from '@/lib/cleaning-constants';
import type { MaterialListDto } from '@/types/reference';

export interface CleaningRunData {
  enabled: boolean;
  durationDays: string;
  durationHours: string;
  durationMinutes: string;
  purpose: string;
  materials: StageMaterial[];
}

interface CleaningRunSectionProps {
  data: CleaningRunData;
  availableMaterials: MaterialListDto[];
  onChange: (data: CleaningRunData) => void;
}

export function CleaningRunSection({
  data,
  availableMaterials,
  onChange,
}: CleaningRunSectionProps) {
  const updateField = <K extends keyof CleaningRunData>(field: K, value: CleaningRunData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const handleDurationChange = (field: 'durationDays' | 'durationHours' | 'durationMinutes') => (value: string) => {
    // Allow empty string or valid non-negative integers
    if (value === '' || /^\d+$/.test(value)) {
      updateField(field, value);
    }
  };

  const handleDurationPreset = (totalMinutes: number) => {
    const days = Math.floor(totalMinutes / 1440);
    const remainingMinutes = totalMinutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;

    onChange({
      ...data,
      durationDays: String(days),
      durationHours: String(hours),
      durationMinutes: String(minutes),
    });
  };

  const currentTotalMinutes =
    (parseInt(data.durationDays) || 0) * 1440 +
    (parseInt(data.durationHours) || 0) * 60 +
    (parseInt(data.durationMinutes) || 0);

  const durationSummary = currentTotalMinutes > 0
    ? `(${data.durationDays}d ${data.durationHours}h ${data.durationMinutes}m)`
    : '';

  return (
    <Collapsible open={data.enabled} onOpenChange={(open) => updateField('enabled', open)}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Cleaning Run</span>
            {durationSummary && (
              <span className="text-muted-foreground text-sm">{durationSummary}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4">
          {/* Duration */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Days</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={data.durationDays}
                  onChange={(e) => handleDurationChange('durationDays')(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hours</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="23"
                  value={data.durationHours}
                  onChange={(e) => handleDurationChange('durationHours')(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Minutes</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  value={data.durationMinutes}
                  onChange={(e) => handleDurationChange('durationMinutes')(e.target.value)}
                />
              </div>
            </div>
            {/* Duration Presets */}
            <div className="flex flex-wrap gap-1 mt-2">
              {CLEANING_DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.minutes}
                  type="button"
                  variant={currentTotalMinutes === preset.minutes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDurationPreset(preset.minutes)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Cleaning Purpose */}
          <div className="space-y-2">
            <Label>Purpose (optional)</Label>
            <Select value={data.purpose} onValueChange={(value) => updateField('purpose', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose..." />
              </SelectTrigger>
              <SelectContent className="z-[70]">
                {CLEANING_PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cleaning Materials */}
          <StageMaterialsSection
            materials={data.materials}
            availableMaterials={availableMaterials}
            onMaterialsChange={(materials) => updateField('materials', materials)}
            excludeAbrasives
          />
        </CollapsibleContent>
    </Collapsible>
  );
}
