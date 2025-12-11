'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, Plus, X } from 'lucide-react';
import { useMaterials } from '@/hooks/use-materials';
import type { CreateCleaningMaterialRequest } from '@/types/cycle';

// Cleaning purpose options matching the backend enum
const CLEANING_PURPOSES = [
  { value: 'PostStageClean', label: 'Post-Stage Clean' },
  { value: 'PrePolishClean', label: 'Pre-Polish Clean' },
  { value: 'FinalBurnish', label: 'Final Burnish' },
  { value: 'GritRemoval', label: 'Grit Removal' },
];

// Duration presets in minutes
const DURATION_PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1 day', minutes: 1440 },
  { label: '2 days', minutes: 2880 },
];

interface CleaningRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageId: string;
  stageName: string;
  cycleId: string;
}

export function CleaningRunModal({
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
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{
    materialId: string;
    displayAmount: string;
    displayUnit: string;
  }>>([]);

  const resetForm = () => {
    setDurationDays('0');
    setDurationHours('1');
    setDurationMinutes('0');
    setPurpose('PostStageClean');
    setNotes('');
    setReminderEnabled(false);
    setSelectedMaterials([]);
  };

  const addCleaningRunMutation = useMutation({
    mutationFn: () => {
      // Calculate total minutes from days, hours, and minutes
      const totalMinutes = (parseInt(durationDays) || 0) * 1440 + (parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0);

      const materialsToSubmit: CreateCleaningMaterialRequest[] = selectedMaterials
        .filter(m => m.materialId)
        .map(m => ({
          materialId: m.materialId,
          displayAmount: m.displayAmount ? parseFloat(m.displayAmount) : undefined,
          displayUnit: m.displayUnit || undefined,
        }));

      return cycleApi.addCleaningRun(stageId, {
        durationMinutes: totalMinutes,
        purpose: purpose || undefined,
        reminderEnabled,
        notes: notes || undefined,
        materials: materialsToSubmit.length > 0 ? materialsToSubmit : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
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
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    setDurationDays(String(days));
    setDurationHours(String(hours));
    setDurationMinutes(String(mins));
  };

  const addMaterial = () => {
    setSelectedMaterials([...selectedMaterials, { materialId: '', displayAmount: '', displayUnit: 'tbsp' }]);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Cleaning Run</DialogTitle>
          <DialogDescription>
            For: {stageName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Days</Label>
                <Input
                  type="number"
                  min="0"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hours</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.minutes}
                  type="button"
                  variant={currentMinutes === preset.minutes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetClick(preset.minutes)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label>Purpose <span className="text-destructive">*</span></Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose..." />
              </SelectTrigger>
              <SelectContent>
                {CLEANING_PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materials</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addMaterial}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {selectedMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No materials added yet. Click &quot;Add&quot; to add soap, media, etc.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedMaterials.map((mat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={mat.materialId}
                      onValueChange={(value) => updateMaterial(index, 'materialId', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.filter(m => m.category !== 'Abrasive').map((m) => (
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
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="e.g., Extra rinse to remove all grit residue..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Reminder */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cleaningReminderEnabled"
              checked={reminderEnabled}
              onCheckedChange={(checked) => setReminderEnabled(checked as boolean)}
            />
            <Label htmlFor="cleaningReminderEnabled">
              Set a reminder when cleaning is complete
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addCleaningRunMutation.isPending}>
            {addCleaningRunMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Cleaning Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
