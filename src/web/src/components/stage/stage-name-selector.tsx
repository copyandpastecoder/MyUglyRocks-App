'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STAGE_NAMES = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish', 'Custom'];

interface StageNameSelectorProps {
  stageName: string;
  customStageName: string;
  onStageNameChange: (name: string) => void;
  onCustomStageNameChange: (name: string) => void;
}

export function StageNameSelector({
  stageName,
  customStageName,
  onStageNameChange,
  onCustomStageNameChange,
}: StageNameSelectorProps) {
  const standardNames = STAGE_NAMES.slice(0, -1); // Exclude 'Custom' from standard names
  const isCustom = stageName === 'Custom' || !standardNames.includes(stageName);

  return (
    <div className="space-y-2">
      <Label>Stage Name</Label>
      <div className="flex flex-wrap gap-1">
        {STAGE_NAMES.map(name => (
          <Button
            key={name}
            type="button"
            variant={stageName === name || (name === 'Custom' && isCustom) ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (name === 'Custom') {
                onStageNameChange('Custom');
                onCustomStageNameChange('');
              } else {
                onStageNameChange(name);
                onCustomStageNameChange('');
              }
            }}
          >
            {name}
          </Button>
        ))}
      </div>
      {/* Custom stage name input - show when Custom is selected or when stage name is not in standard list */}
      {isCustom && (
        <Input
          placeholder="Enter custom stage name..."
          value={stageName === 'Custom' ? customStageName : stageName}
          onChange={(e) => {
            const value = e.target.value;
            onCustomStageNameChange(value);
            if (value) {
              onStageNameChange(value);
            } else {
              onStageNameChange('Custom');
            }
          }}
          className="mt-2"
        />
      )}
    </div>
  );
}
