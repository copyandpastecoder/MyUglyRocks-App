'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface BarrelOption {
  barrelId: string;
  barrelNumber: number;
  nickname: string | null;
  capacityLbs: number | null;
  tumblerName: string;
  tumblerId: string;
}

interface BarrelSelectorProps {
  barrels: BarrelOption[];
  selectedBarrelIds: string[];
  onSelectionChange: (barrelIds: string[]) => void;
}

export function BarrelSelector({
  barrels,
  selectedBarrelIds,
  onSelectionChange,
}: BarrelSelectorProps) {
  const toggleBarrel = (barrelId: string) => {
    if (selectedBarrelIds.includes(barrelId)) {
      onSelectionChange(selectedBarrelIds.filter(id => id !== barrelId));
    } else {
      onSelectionChange([...selectedBarrelIds, barrelId]);
    }
  };

  const sortedBarrels = [...barrels].sort((a, b) => {
    const tumblerCompare = (a.tumblerName || '').localeCompare(b.tumblerName || '');
    if (tumblerCompare !== 0) return tumblerCompare;
    return a.barrelNumber - b.barrelNumber;
  });

  return (
    <div className="space-y-2">
      <Label>Select Barrel(s)</Label>
      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
        {sortedBarrels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No active barrels available
          </p>
        ) : (
          sortedBarrels.map(barrel => (
            <div key={barrel.barrelId} className="flex items-center space-x-2">
              <Checkbox
                id={`barrel-${barrel.barrelId}`}
                checked={selectedBarrelIds.includes(barrel.barrelId)}
                onCheckedChange={() => toggleBarrel(barrel.barrelId)}
              />
              <label
                htmlFor={`barrel-${barrel.barrelId}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {barrel.tumblerName} - Barrel #{barrel.barrelNumber}
                {barrel.nickname && ` (${barrel.nickname})`}
                {barrel.capacityLbs && (
                  <span className="text-muted-foreground ml-1">
                    - {barrel.capacityLbs} lbs
                  </span>
                )}
              </label>
            </div>
          ))
        )}
      </div>
      {selectedBarrelIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedBarrelIds.length} barrel(s) selected
        </p>
      )}
    </div>
  );
}
