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
import { ChevronDown } from 'lucide-react';
import { WeightInput } from '@/components/weight-input';

const WATER_UNITS = [
  { value: 'ml', label: 'ml' },
  { value: 'floz', label: 'fl oz' },
];

export interface StageAdvancedData {
  loadWeightBeforeGrams: number | null;
  fillLevelPercent: string;
  waterAmount: string;
  waterUnit: string;
}

interface StageAdvancedOptionsProps {
  data: StageAdvancedData;
  onChange: (data: StageAdvancedData) => void;
  /** Total capacity of selected barrels in lbs (for weight validation) */
  barrelCapacityLbs?: number;
  onWeightValidationChange?: (hasError: boolean) => void;
}

export function StageAdvancedOptions({
  data,
  onChange,
  barrelCapacityLbs,
  onWeightValidationChange,
}: StageAdvancedOptionsProps) {
  const updateField = <K extends keyof StageAdvancedData>(field: K, value: StageAdvancedData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between h-auto p-0 hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">Advanced Options</span>
              <span className="text-muted-foreground text-sm">(optional)</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4">
          {/* Load Weight */}
          <WeightInput
            label="Load Weight Before"
            valueGrams={data.loadWeightBeforeGrams}
            onValueChange={(value) => updateField('loadWeightBeforeGrams', value)}
            barrelCapacityLbs={barrelCapacityLbs}
            onValidationChange={onWeightValidationChange}
          />

          {/* Fill Level */}
          <div className="space-y-2">
            <Label>Barrel Fill Level (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="e.g., 75"
              value={data.fillLevelPercent}
              onChange={(e) => updateField('fillLevelPercent', e.target.value)}
            />
          </div>

          {/* Water Amount */}
          <div className="space-y-2">
            <Label>Water Amount</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g., 250"
                value={data.waterAmount}
                onChange={(e) => updateField('waterAmount', e.target.value)}
                className="flex-1"
              />
              <Select value={data.waterUnit} onValueChange={(value) => updateField('waterUnit', value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WATER_UNITS.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
