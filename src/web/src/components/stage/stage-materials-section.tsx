'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AmountInput } from '@/components/amount-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { MaterialListDto } from '@/types/reference';

export interface StageMaterial {
  materialId: string;
  displayAmount: string;
  displayUnit: string;
}

interface StageMaterialsSectionProps {
  materials: StageMaterial[];
  availableMaterials: MaterialListDto[];
  onMaterialsChange: (materials: StageMaterial[]) => void;
  /** If true, filters out abrasives (for cleaning materials) */
  excludeAbrasives?: boolean;
}

const UNIT_OPTIONS = [
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'cup', label: 'cup' },
  { value: 'oz', label: 'oz' },
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
];

export function StageMaterialsSection({
  materials,
  availableMaterials,
  onMaterialsChange,
  excludeAbrasives = false,
}: StageMaterialsSectionProps) {
  const filteredMaterials = excludeAbrasives
    ? availableMaterials.filter(m => m.category !== 'Abrasive')
    : availableMaterials;

  const addMaterial = () => {
    onMaterialsChange([...materials, { materialId: '', displayAmount: '', displayUnit: 'tbsp' }]);
  };

  const removeMaterial = (index: number) => {
    onMaterialsChange(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: keyof StageMaterial, value: string) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    onMaterialsChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Materials</Label>
        <Button type="button" variant="ghost" size="sm" onClick={addMaterial}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No materials added yet. Click &quot;Add&quot; to add grit, polish, or media.
        </p>
      ) : (
        <div className="space-y-2">
          {materials.map((mat, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={mat.materialId}
                onValueChange={(value) => updateMaterial(index, 'materialId', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select material..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredMaterials.map(m => (
                    <SelectItem key={m.materialId} value={m.materialId}>
                      {m.commonName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AmountInput
                min={0}
                placeholder="Amt"
                className="w-20"
                value={mat.displayAmount}
                onChange={(e) => updateMaterial(index, 'displayAmount', e.target.value)}
              />
              <Select
                value={mat.displayUnit}
                onValueChange={(value) => updateMaterial(index, 'displayUnit', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeMaterial(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
