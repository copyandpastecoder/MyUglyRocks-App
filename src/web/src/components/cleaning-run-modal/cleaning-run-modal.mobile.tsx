'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AmountInput } from '@/components/amount-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Check, Loader2, Plus, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMaterials } from '@/hooks/use-materials';
import { CLEANING_PURPOSES, CLEANING_DURATION_PRESETS } from '@/lib/cleaning-constants';
import { MATERIAL_UNITS, formatMaterialsForSubmission } from '@/lib/material-utils';
import type { MaterialFormItem } from '@/lib/material-utils';
import { convertMinutesToDaysHoursMinutes } from '@/lib/duration-utils';
import { invalidateCycleQueries } from '@/lib/query-invalidation';
import type { CreateCleaningMaterialRequest } from '@/types/cycle';
import type { CleaningRunModalProps } from './types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function CleaningRunModalMobile({
  open,
  onOpenChange,
  stageId,
  stageName,
  cycleId,
}: CleaningRunModalProps) {
  const queryClient = useQueryClient();
  const { data: materials } = useMaterials();

  // Form state
  const [durationDays, setDurationDays] = useState<string>('0');
  const [durationHours, setDurationHours] = useState<string>('1');
  const [durationMinutes, setDurationMinutes] = useState<string>('0');
  const [purpose, setPurpose] = useState<string>('PostStageClean');
  const [notes, setNotes] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialFormItem[]>([]);

  // Mobile-specific state
  const [materialSelectorOpen, setMaterialSelectorOpen] = useState(false);
  const [selectingMaterialIndex, setSelectingMaterialIndex] = useState<number | null>(null);
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialsExpanded, setMaterialsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const resetForm = () => {
    setDurationDays('0');
    setDurationHours('1');
    setDurationMinutes('0');
    setPurpose('PostStageClean');
    setNotes('');
    setReminderEnabled(false);
    setSelectedMaterials([]);
    setMaterialsExpanded(false);
    setNotesExpanded(false);
  };

  const addCleaningRunMutation = useMutation({
    mutationFn: () => {
      const totalMinutes = (parseInt(durationDays) || 0) * 1440 + (parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0);
      const materialsToSubmit = formatMaterialsForSubmission(selectedMaterials) as CreateCleaningMaterialRequest[];

      return cycleApi.addCleaningRun(stageId, {
        durationMinutes: totalMinutes,
        purpose: purpose || undefined,
        reminderEnabled,
        notes: notes || undefined,
        materials: materialsToSubmit.length > 0 ? materialsToSubmit : undefined,
      });
    },
    onSuccess: () => {
      invalidateCycleQueries(queryClient, cycleId);
      toast.success('Cleaning run added');
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to add cleaning run');
    },
  });

  const handleSubmit = () => {
    const totalMinutes = (parseInt(durationDays) || 0) * 1440 + (parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0);
    if (totalMinutes <= 0) {
      toast.error('Duration must be at least 1 minute');
      return;
    }
    if (!purpose) {
      toast.error('Purpose is required');
      return;
    }
    addCleaningRunMutation.mutate();
  };

  const handlePresetClick = (minutes: number) => {
    const { days, hours, mins } = convertMinutesToDaysHoursMinutes(minutes);
    setDurationDays(String(days));
    setDurationHours(String(hours));
    setDurationMinutes(String(mins));
  };

  const addMaterial = () => {
    setSelectedMaterials([...selectedMaterials, { materialId: '', displayAmount: '', displayUnit: 'tbsp' }]);
    setMaterialsExpanded(true);
  };

  const removeMaterial = (index: number) => {
    setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: 'materialId' | 'displayAmount' | 'displayUnit', value: string) => {
    const updated = [...selectedMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMaterials(updated);
  };

  const currentMinutes = (parseInt(durationDays) || 0) * 1440 + (parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0);

  // Filter out abrasives and sort alphabetically by name
  const sortedMaterials = useMemo(() => {
    if (!materials) return [];
    return [...materials]
      .filter(m => m.category !== 'Abrasive')
      .sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [materials]);

  // Filtered materials for search
  const filteredMaterials = useMemo(() => {
    if (!materialSearch) return sortedMaterials;
    return sortedMaterials.filter(m =>
      m.commonName.toLowerCase().includes(materialSearch.toLowerCase())
    );
  }, [sortedMaterials, materialSearch]);

  const openMaterialSelector = (index: number) => {
    setSelectingMaterialIndex(index);
    setMaterialSearch('');
    setMaterialSelectorOpen(true);
  };

  const selectMaterial = (materialId: string) => {
    if (selectingMaterialIndex !== null) {
      updateMaterial(selectingMaterialIndex, 'materialId', materialId);
      setMaterialSelectorOpen(false);
      setSelectingMaterialIndex(null);
    }
  };

  // Material selector sheet (nested)
  const MaterialSelectorSheet = (
    <Sheet open={materialSelectorOpen} onOpenChange={setMaterialSelectorOpen}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>Select Material</SheetTitle>
          <SheetDescription>Choose a material for cleaning</SheetDescription>
        </SheetHeader>
        <div className="p-4 border-b">
          <Input
            placeholder="Search materials..."
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredMaterials.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No materials found
            </div>
          ) : (
            <div className="divide-y">
              {filteredMaterials.map((m) => {
                const isSelected = selectingMaterialIndex !== null &&
                  selectedMaterials[selectingMaterialIndex]?.materialId === m.materialId;
                return (
                  <button
                    key={m.materialId}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left active:bg-muted min-h-[56px]",
                      isSelected && "bg-primary/10"
                    )}
                    onClick={() => selectMaterial(m.materialId)}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{m.commonName}</div>
                      <div className="text-sm text-muted-foreground">{m.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle>Add Cleaning Run</SheetTitle>
            <SheetDescription>For: {stageName}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Duration</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Days</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="h-12 text-base text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Hours</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="23"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="h-12 text-base text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Minutes</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="h-12 text-base text-center"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CLEANING_DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.minutes}
                    type="button"
                    variant={currentMinutes === preset.minutes ? 'default' : 'outline'}
                    size="sm"
                    className="min-h-[40px]"
                    onClick={() => handlePresetClick(preset.minutes)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Purpose <span className="text-destructive">*</span>
              </Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select purpose..." />
                </SelectTrigger>
                <SelectContent>
                  {CLEANING_PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="py-3">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Materials - Collapsible */}
            <Collapsible open={materialsExpanded} onOpenChange={setMaterialsExpanded}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                    <Label className="text-base font-semibold cursor-pointer">
                      Materials {selectedMaterials.length > 0 && `(${selectedMaterials.length})`}
                    </Label>
                    <ChevronDown className={cn(
                      "h-4 w-4 ml-2 transition-transform",
                      materialsExpanded && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <Button type="button" variant="ghost" size="sm" onClick={addMaterial} className="min-h-[44px]">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <CollapsibleContent className="mt-3">
                {selectedMaterials.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No materials added yet. Tap &quot;Add&quot; to add soap, media, etc.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedMaterials.map((mat, index) => {
                      const selectedMaterial = sortedMaterials.find(m => m.materialId === mat.materialId);
                      return (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              className="flex-1 justify-start h-12 text-base mr-2"
                              onClick={() => openMaterialSelector(index)}
                            >
                              <span className={cn(!selectedMaterial && "text-muted-foreground")}>
                                {selectedMaterial?.commonName || "Select material..."}
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-12 w-12 flex-shrink-0"
                              onClick={() => removeMaterial(index)}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <AmountInput
                              min={0}
                              placeholder="Amount"
                              className="flex-1 h-12 text-base"
                              value={mat.displayAmount}
                              onChange={(e) => updateMaterial(index, 'displayAmount', e.target.value)}
                            />
                            <Select
                              value={mat.displayUnit}
                              onValueChange={(value) => updateMaterial(index, 'displayUnit', value)}
                            >
                              <SelectTrigger className="w-28 h-12 text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MATERIAL_UNITS.map((unit) => (
                                  <SelectItem key={unit.value} value={unit.value} className="py-3">
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Notes - Collapsible */}
            <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                  <Label className="text-base font-semibold cursor-pointer">
                    Notes {notes && "(1)"}
                  </Label>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-2 transition-transform",
                    notesExpanded && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <Textarea
                  placeholder="e.g., Extra rinse to remove all grit residue..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="text-base"
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Reminder */}
            <div className="flex items-center space-x-3 py-2">
              <Checkbox
                id="cleaningReminderEnabledMobile"
                checked={reminderEnabled}
                onCheckedChange={(checked) => setReminderEnabled(checked as boolean)}
                className="h-6 w-6"
              />
              <Label htmlFor="cleaningReminderEnabledMobile" className="text-base cursor-pointer">
                Set a reminder when cleaning is complete
              </Label>
            </div>
          </div>

          <SheetFooter className="p-4 border-t bg-background">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={addCleaningRunMutation.isPending}
                className="flex-1 h-12 text-base"
              >
                {addCleaningRunMutation.isPending && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {MaterialSelectorSheet}
    </>
  );
}
