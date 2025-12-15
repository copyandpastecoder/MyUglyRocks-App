'use client';

import { useState, useMemo } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  // Filter and sort materials alphabetically by name
  const sortedMaterials = useMemo(() => {
    const filtered = excludeAbrasives
      ? availableMaterials.filter(m => m.category !== 'Abrasive')
      : availableMaterials;
    return [...filtered].sort((a, b) =>
      a.commonName.localeCompare(b.commonName)
    );
  }, [availableMaterials, excludeAbrasives]);

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
            <MaterialRow
              key={index}
              material={mat}
              sortedMaterials={sortedMaterials}
              onMaterialChange={(field, value) => updateMaterial(index, field, value)}
              onRemove={() => removeMaterial(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MaterialRowProps {
  material: StageMaterial;
  sortedMaterials: MaterialListDto[];
  onMaterialChange: (field: keyof StageMaterial, value: string) => void;
  onRemove: () => void;
}

function MaterialRow({ material, sortedMaterials, onMaterialChange, onRemove }: MaterialRowProps) {
  const [open, setOpen] = useState(false);

  const selectedMaterial = sortedMaterials.find(m => m.materialId === material.materialId);

  return (
    <div className="flex items-center gap-2">
      {/* Searchable Material Combobox */}
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between font-normal"
          >
            <span className={cn(!selectedMaterial && "text-muted-foreground")}>
              {selectedMaterial?.commonName || "Select material..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[400px] p-0"
          align="start"
          onWheelCapture={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandInput placeholder="Search materials..." />
            <CommandList>
              <CommandEmpty>No material found.</CommandEmpty>
              <CommandGroup>
                {sortedMaterials.map((m) => (
                  <CommandItem
                    key={m.materialId}
                    value={m.commonName}
                    onSelect={() => {
                      onMaterialChange('materialId', m.materialId);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        material.materialId === m.materialId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {m.commonName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Amount Input */}
      <AmountInput
        min={0}
        placeholder="Amt"
        className="w-20"
        value={material.displayAmount}
        onChange={(e) => onMaterialChange('displayAmount', e.target.value)}
      />

      {/* Unit Selector */}
      <Select
        value={material.displayUnit}
        onValueChange={(value) => onMaterialChange('displayUnit', value)}
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

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
