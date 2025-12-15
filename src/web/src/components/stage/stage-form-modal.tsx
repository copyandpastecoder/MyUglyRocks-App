'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { StageMaterialsSection } from '@/components/stage/stage-materials-section';
import { CleaningRunSection } from '@/components/stage/cleaning-run-section';
import { toast } from 'sonner';
import {
  Clock,
  Loader2,
  ChevronDown,
  Copy,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { DurationPicker } from '@/components/duration-picker';
import { WeightInput } from '@/components/weight-input';
import { useSettings, useTimezone } from '@/hooks/use-user';
import { formatDateTimeLocal, isStageStartBeforeCycleStart, calculateDurationFromDates } from '@/lib/date-utils';
import { convertMinutesToDaysHoursMinutes } from '@/lib/duration-utils';
import type { CycleDto, StageRunDto, StageRunSummaryDto, CreateStageMaterialRequest, CreateCleaningMaterialRequest } from '@/types/cycle';
import type { BarrelDto } from '@/types/tumbler';
import type { MaterialListDto } from '@/types/reference';

const STAGE_NAMES = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish', 'Custom'];
const WATER_UNITS = [
  { value: 'ml', label: 'ml' },
  { value: 'floz', label: 'fl oz' },
];

export interface BarrelInfo extends BarrelDto {
  tumblerName: string;
  tumblerId: string;
}

interface StageFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  cycle: CycleDto;
  stageRunId?: string; // If provided, we're in edit mode
  allBarrels: BarrelInfo[];
  materials: MaterialListDto[];
  onSuccess?: () => void;
}

export function StageFormModal({
  open,
  onOpenChange,
  cycleId,
  cycle,
  stageRunId,
  allBarrels,
  materials,
  onSuccess,
}: StageFormModalProps) {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const { toUserTz, now: getNow, formatForInput } = useTimezone();

  const isEditMode = !!stageRunId;

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBarrelIds, setSelectedBarrelIds] = useState<string[]>([]);
  const [stageName, setStageName] = useState<string>('Coarse');
  const [customStageName, setCustomStageName] = useState<string>('');
  const [stageStartDateTime, setStageStartDateTime] = useState<string>('');
  const [durationDays, setDurationDays] = useState<string>('7');
  const [durationHours, setDurationHours] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState<'afterDays' | 'atEnd'>('atEnd');
  const [remindAfterDays, setRemindAfterDays] = useState<string>('7');
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; displayAmount: string; displayUnit: string }>>([]);

  // Advanced fields
  const [loadWeightBeforeGrams, setLoadWeightBeforeGrams] = useState<number | null>(null);
  const [weightBeforeValidationError, setWeightBeforeValidationError] = useState(false);
  const [waterAmount, setWaterAmount] = useState<string>('');
  const [waterUnit, setWaterUnit] = useState<string>('ml');

  // Copy from previous state
  const [isCopyingFromPrevious, setIsCopyingFromPrevious] = useState(false);

  // Cleaning run state
  const [addCleaningRun, setAddCleaningRun] = useState(false);
  const [cleaningDurationDays, setCleaningDurationDays] = useState<string>('0');
  const [cleaningDurationHours, setCleaningDurationHours] = useState<string>('0');
  const [cleaningDurationMinutes, setCleaningDurationMinutes] = useState<string>('0');
  const [cleaningPurpose, setCleaningPurpose] = useState<string>('');
  const [cleaningNotes, setCleaningNotes] = useState<string>('');
  const [cleaningMaterials, setCleaningMaterials] = useState<Array<{ materialId: string; displayAmount: string; displayUnit: string }>>([]);
  const [_cleaningRunId, setCleaningRunId] = useState<string | undefined>();

  // Calculate total barrel capacity from selected barrels (for weight validation)
  const selectedBarrelCapacityLbs = selectedBarrelIds.reduce((total, id) => {
    const barrel = allBarrels.find(b => b.barrelId === id);
    return total + (barrel?.capacityLbs || 0);
  }, 0);

  const resetForm = useCallback(() => {
    setSelectedBarrelIds([]);
    setStageName('Coarse');
    setCustomStageName('');
    setStageStartDateTime('');
    setDurationDays('7');
    setDurationHours('0');
    setNotes('');
    setReminderEnabled(false);
    setReminderType('atEnd');
    setRemindAfterDays('7');
    setSelectedMaterials([]);
    setLoadWeightBeforeGrams(null);
    setWeightBeforeValidationError(false);
    setWaterAmount('');
    setWaterUnit(settings?.measurementSystem === 'Imperial' ? 'floz' : 'ml');
    setAddCleaningRun(false);
    setCleaningDurationDays('0');
    setCleaningDurationHours('0');
    setCleaningDurationMinutes('0');
    setCleaningPurpose('');
    setCleaningNotes('');
    setCleaningMaterials([]);
    setCleaningRunId(undefined);
    setIsLoading(false);
  }, [settings?.measurementSystem]);

  // Load existing stage data when editing
  const loadStageData = useCallback(async (stageId: string) => {
    setIsLoading(true);
    try {
      const fullStage: StageRunDto = await cycleApi.getStageRun(stageId);

      // Stage name
      const standardNames = STAGE_NAMES.slice(0, -1);
      setStageName(standardNames.includes(fullStage.stageName) ? fullStage.stageName : 'Custom');
      setCustomStageName(!standardNames.includes(fullStage.stageName) ? fullStage.stageName : '');

      // Start date/time - convert UTC to user's timezone for input
      setStageStartDateTime(formatForInput(fullStage.startDateTime));

      // Duration - calculate from dates if available (use timezone-aware dates)
      const startDateInTz = toUserTz(fullStage.startDateTime);
      const endDateString = fullStage.endDateTime ?? fullStage.durationEstimateEndDate;
      const endDateInTz = endDateString ? toUserTz(endDateString) : getNow();
      const { days, hours } = calculateDurationFromDates(startDateInTz!, endDateInTz!);
      setDurationDays(String(days));
      setDurationHours(String(hours));

      // Notes
      setNotes(fullStage.notes || '');

      // Barrels
      if (fullStage.barrels && fullStage.barrels.length > 0) {
        setSelectedBarrelIds(fullStage.barrels.map(b => b.barrelId));
      }

      // Materials
      if (fullStage.materials && fullStage.materials.length > 0) {
        setSelectedMaterials(fullStage.materials.map(m => ({
          materialId: m.materialId,
          displayAmount: m.displayAmount?.toString() || '',
          displayUnit: m.displayUnit || 'tbsp',
        })));
      }

      // Reminder settings
      setReminderEnabled(fullStage.reminderEnabled);
      if (fullStage.remindAfterDays) {
        setReminderType('afterDays');
        setRemindAfterDays(String(fullStage.remindAfterDays));
      } else if (fullStage.remindAtEndOfStage) {
        setReminderType('atEnd');
      }

      // Advanced options
      setLoadWeightBeforeGrams(fullStage.loadWeightBeforeGrams);
      // Set water amount and unit based on user's measurement system
      const preferredWaterUnit = settings?.measurementSystem === 'Imperial' ? 'floz' : 'ml';
      setWaterUnit(preferredWaterUnit);
      if (fullStage.waterAmountMl) {
        // Convert from ml to user's preferred unit
        const displayValue = preferredWaterUnit === 'floz'
          ? (fullStage.waterAmountMl / 29.5735).toFixed(1)
          : fullStage.waterAmountMl.toString();
        setWaterAmount(displayValue);
      } else {
        setWaterAmount('');
      }

      // Cleaning run
      if (fullStage.cleaningRun) {
        setAddCleaningRun(true);
        setCleaningRunId(fullStage.cleaningRun.cleaningRunId);
        const { days, hours, mins } = convertMinutesToDaysHoursMinutes(fullStage.cleaningRun.durationMinutes);
        setCleaningDurationDays(String(days));
        setCleaningDurationHours(String(hours));
        setCleaningDurationMinutes(String(mins));
        setCleaningPurpose(fullStage.cleaningRun.purpose || '');
        setCleaningNotes(fullStage.cleaningRun.notes || '');
        if (fullStage.cleaningRun.materials && fullStage.cleaningRun.materials.length > 0) {
          setCleaningMaterials(fullStage.cleaningRun.materials.map(m => ({
            materialId: m.materialId,
            displayAmount: m.displayAmount?.toString() || '',
            displayUnit: m.displayUnit || 'tbsp',
          })));
        }
      }
    } catch {
      toast.error('Failed to load stage data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (isEditMode && stageRunId) {
        loadStageData(stageRunId);
      } else {
        resetForm();
        // Set initial start datetime for new stages (use user's timezone)
        if (cycle.stageRuns.length === 0) {
          // For first stage, use cycle start date with current time in user's timezone
          const [year, month, day] = cycle.startDate.split('-').map(Number);
          const nowInTz = getNow();
          const startDate = new Date(year, month - 1, day, nowInTz.getHours(), nowInTz.getMinutes());
          setStageStartDateTime(formatDateTimeLocal(startDate));
        } else {
          // For subsequent stages, use current time in user's timezone
          setStageStartDateTime(formatDateTimeLocal(getNow()));
        }
        // Check for auto-populate from repeat
        autoPopulateFromRepeat();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, stageRunId]);

  // Auto-populate from repeat action
  const autoPopulateFromRepeat = async () => {
    if (cycle.stageRuns.length === 0) return;

    const lastCompletedStage = [...cycle.stageRuns]
      .reverse()
      .find(s => s.status === 'Completed');

    if (!lastCompletedStage) return;

    try {
      const fullStage: StageRunDto = await cycleApi.getStageRun(lastCompletedStage.stageRunId);
      if (fullStage.nextAction === 'Repeat') {
        setStageName(fullStage.stageName);

        // Use timezone-aware date conversion
        const endDateString = fullStage.endDateTime ?? fullStage.durationEstimateEndDate;
        if (endDateString) {
          setStageStartDateTime(formatForInput(endDateString));
        }

        if (fullStage.barrels && fullStage.barrels.length > 0) {
          const activeBarrelIds = fullStage.barrels
            .map(b => b.barrelId)
            .filter(id => allBarrels.some(b => b.barrelId === id));
          setSelectedBarrelIds(activeBarrelIds);
        }

        if (fullStage.materials && fullStage.materials.length > 0) {
          setSelectedMaterials(fullStage.materials.map(m => ({
            materialId: m.materialId,
            displayAmount: m.displayAmount ? String(m.displayAmount) : '',
            displayUnit: m.displayUnit || 'tbsp',
          })));
        }

        setDurationDays(String(fullStage.durationDays));
        setDurationHours(String(fullStage.durationHours));

        if (fullStage.notes) {
          setNotes(fullStage.notes);
        }

        if (fullStage.cleaningRun) {
          setAddCleaningRun(true);
          const { days, hours, mins } = convertMinutesToDaysHoursMinutes(fullStage.cleaningRun.durationMinutes);
          setCleaningDurationDays(String(days));
          setCleaningDurationHours(String(hours));
          setCleaningDurationMinutes(String(mins));
          setCleaningPurpose(fullStage.cleaningRun.purpose || 'PostStageClean');
          setCleaningNotes(fullStage.cleaningRun.notes || '');
          if (fullStage.cleaningRun.materials && fullStage.cleaningRun.materials.length > 0) {
            setCleaningMaterials(fullStage.cleaningRun.materials.map(m => ({
              materialId: m.materialId,
              displayAmount: m.displayAmount ? String(m.displayAmount) : '',
              displayUnit: m.displayUnit || 'tbsp',
            })));
          }
        }

        toast.info(`Auto-filled from previous "${fullStage.stageName}" stage (marked for repeat)`);
      }
    } catch {
      // Ignore - just don't auto-populate
    }
  };

  // Copy from previous stage
  const copyFromPreviousStage = async () => {
    if (cycle.stageRuns.length === 0) return;

    const previousStageSummary = cycle.stageRuns[cycle.stageRuns.length - 1];

    setIsCopyingFromPrevious(true);
    try {
      const previousStage: StageRunDto = await cycleApi.getStageRun(previousStageSummary.stageRunId);

      // Use timezone-aware date conversion
      const endDateString = previousStage.endDateTime ?? previousStage.durationEstimateEndDate;
      if (endDateString) {
        setStageStartDateTime(formatForInput(endDateString));
      }

      if (previousStage.barrels && previousStage.barrels.length > 0) {
        const activeBarrelIds = previousStage.barrels
          .map(b => b.barrelId)
          .filter(id => allBarrels.some(b => b.barrelId === id));
        setSelectedBarrelIds(activeBarrelIds);
      }

      // Copy materials if same stage type
      const currentStageName = stageName === 'Custom' ? customStageName : stageName;
      if (currentStageName === previousStage.stageName && previousStage.materials && previousStage.materials.length > 0) {
        setSelectedMaterials(previousStage.materials.map(m => ({
          materialId: m.materialId,
          displayAmount: m.displayAmount ? String(m.displayAmount) : '',
          displayUnit: m.displayUnit || 'tbsp',
        })));
      }

      setDurationDays(String(previousStage.durationDays));
      setDurationHours(String(previousStage.durationHours));

      if (previousStage.cleaningRun) {
        setAddCleaningRun(true);
        const { days, hours, mins } = convertMinutesToDaysHoursMinutes(previousStage.cleaningRun.durationMinutes);
        setCleaningDurationDays(String(days));
        setCleaningDurationHours(String(hours));
        setCleaningDurationMinutes(String(mins));
        setCleaningPurpose(previousStage.cleaningRun.purpose || 'PostStageClean');
        setCleaningNotes(previousStage.cleaningRun.notes || '');
        if (previousStage.cleaningRun.materials && previousStage.cleaningRun.materials.length > 0) {
          setCleaningMaterials(previousStage.cleaningRun.materials.map(m => ({
            materialId: m.materialId,
            displayAmount: m.displayAmount ? String(m.displayAmount) : '',
            displayUnit: m.displayUnit || 'tbsp',
          })));
        }
      }

      toast.success(`Copied settings from previous ${previousStage.stageName} stage`);
    } catch {
      toast.error('Failed to copy from previous stage');
    } finally {
      setIsCopyingFromPrevious(false);
    }
  };

  // Barrel toggle
  const toggleBarrel = (barrelId: string) => {
    setSelectedBarrelIds(prev =>
      prev.includes(barrelId)
        ? prev.filter(id => id !== barrelId)
        : [...prev, barrelId]
    );
  };

  // Create stage mutation
  const addStageMutation = useMutation({
    mutationFn: (data: Parameters<typeof cycleApi.addStageRun>[1]) =>
      cycleApi.addStageRun(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Stage added successfully');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to add stage');
    },
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: (data: Parameters<typeof cycleApi.updateStageRun>[1]) =>
      cycleApi.updateStageRun(stageRunId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Stage updated');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to update stage');
    },
  });

  const handleSubmit = () => {
    const finalStageName = stageName === 'Custom' ? customStageName : stageName;

    // Validation
    if (selectedBarrelIds.length === 0) {
      toast.error('Please select at least one barrel');
      return;
    }
    if (!stageStartDateTime) {
      toast.error('Please set a start date/time');
      return;
    }
    if (!finalStageName || finalStageName === 'Custom') {
      toast.error('Please enter a stage name');
      return;
    }
    if (cycle && isStageStartBeforeCycleStart(cycle.startDate, stageStartDateTime)) {
      toast.error('Stage start date cannot be before the cycle start date');
      return;
    }
    if (weightBeforeValidationError) {
      toast.error('Weight exceeds 150% of barrel capacity. Please correct before saving.');
      return;
    }

    // Validate cleaning run if enabled
    if (addCleaningRun) {
      const cleaningTotalMinutes = (parseInt(cleaningDurationDays) || 0) * 1440 + (parseInt(cleaningDurationHours) || 0) * 60 + (parseInt(cleaningDurationMinutes) || 0);
      if (cleaningTotalMinutes <= 0) {
        toast.error('Cleaning run duration must be at least 1 minute');
        return;
      }
    }

    const materialsToSubmit: CreateStageMaterialRequest[] = selectedMaterials
      .filter(m => m.materialId)
      .map(m => ({
        materialId: m.materialId,
        displayAmount: m.displayAmount ? parseFloat(m.displayAmount) : undefined,
        displayUnit: m.displayUnit || undefined,
      }));

    // Build cleaning run request if enabled
    let cleaningRunRequest = undefined;
    if (addCleaningRun) {
      const cleaningTotalMinutes = (parseInt(cleaningDurationDays) || 0) * 1440 + (parseInt(cleaningDurationHours) || 0) * 60 + (parseInt(cleaningDurationMinutes) || 0);
      const cleaningMaterialsToSubmit: CreateCleaningMaterialRequest[] = cleaningMaterials
        .filter(m => m.materialId)
        .map(m => ({
          materialId: m.materialId,
          displayAmount: m.displayAmount ? parseFloat(m.displayAmount) : undefined,
          displayUnit: m.displayUnit || undefined,
        }));

      cleaningRunRequest = {
        durationMinutes: cleaningTotalMinutes,
        purpose: cleaningPurpose || undefined,
        reminderEnabled: false,
        notes: cleaningNotes || undefined,
        materials: cleaningMaterialsToSubmit.length > 0 ? cleaningMaterialsToSubmit : undefined,
      };
    }

    if (isEditMode) {
      updateStageMutation.mutate({
        barrelIds: selectedBarrelIds.length > 0 ? selectedBarrelIds : undefined,
        stageName: finalStageName,
        startDateTime: new Date(stageStartDateTime).toISOString(),
        durationDays: parseInt(durationDays) || 0,
        durationHours: parseInt(durationHours) || 0,
        notes: notes || undefined,
        reminderEnabled,
        remindAfterDays: reminderType === 'afterDays' ? parseInt(remindAfterDays) : undefined,
        remindAtEndOfStage: reminderType === 'atEnd' ? true : undefined,
        loadWeightBeforeGrams: loadWeightBeforeGrams || undefined,
        waterAmountMl: waterAmount ? Math.round(parseFloat(waterAmount) * (waterUnit === 'floz' ? 29.5735 : 1)) : undefined,
        materials: materialsToSubmit.length > 0 ? materialsToSubmit : undefined,
        cleaningRun: cleaningRunRequest,
      });
    } else {
      addStageMutation.mutate({
        barrelIds: selectedBarrelIds,
        stageName: finalStageName,
        startDateTime: new Date(stageStartDateTime).toISOString(),
        durationDays: parseInt(durationDays) || 0,
        durationHours: parseInt(durationHours) || 0,
        notes: notes || undefined,
        reminderEnabled,
        remindAfterDays: reminderType === 'afterDays' ? parseInt(remindAfterDays) : undefined,
        remindAtEndOfStage: reminderType === 'atEnd' ? true : undefined,
        loadWeightBeforeGrams: loadWeightBeforeGrams || undefined,
        waterAmountMl: waterAmount ? Math.round(parseFloat(waterAmount) * (waterUnit === 'floz' ? 29.5735 : 1)) : undefined,
        materials: materialsToSubmit.length > 0 ? materialsToSubmit : undefined,
        cleaningRun: cleaningRunRequest,
      });
    }
  };

  const isPending = addStageMutation.isPending || updateStageMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle>{isEditMode ? 'Edit Stage' : 'New Stage'}</DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Update the stage details'
                  : 'Start a new tumbling stage for this cycle'}
              </DialogDescription>
            </div>
            <Link
              href="/learn/faq/stages"
              target="_blank"
              className="p-1 hover:bg-muted rounded-md transition-colors"
              title="Stage Tips"
            >
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </Link>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
              <div className="space-y-4 py-4">
                {/* Stage Name */}
                <div className="space-y-2">
                  <Label>Stage Name</Label>
                  <div className="flex flex-wrap gap-1">
                    {STAGE_NAMES.map(name => (
                      <Button
                        key={name}
                        type="button"
                        variant={stageName === name || (name === 'Custom' && !STAGE_NAMES.slice(0, -1).includes(stageName)) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (name === 'Custom') {
                            setStageName('Custom');
                            setCustomStageName('');
                          } else {
                            setStageName(name);
                            setCustomStageName('');
                          }
                        }}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                  {(stageName === 'Custom' || !STAGE_NAMES.slice(0, -1).includes(stageName)) && (
                    <Input
                      placeholder="Enter custom stage name..."
                      aria-label="Custom stage name"
                      value={stageName === 'Custom' ? customStageName : stageName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomStageName(value);
                        if (value) {
                          setStageName(value);
                        } else {
                          setStageName('Custom');
                        }
                      }}
                      className="mt-2"
                    />
                  )}
                  {/* Copy from Previous button - only show in new mode when there are previous stages */}
                  {!isEditMode && cycle.stageRuns.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyFromPreviousStage}
                      disabled={isCopyingFromPrevious}
                      className="mt-2"
                    >
                      {isCopyingFromPrevious ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy from Previous Stage
                    </Button>
                  )}
                </div>

                {/* Barrel Selection */}
                <div className="space-y-2">
                  <Label>Select Barrel(s)</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {allBarrels.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No active barrels available
                      </p>
                    ) : (
                      [...allBarrels].sort((a, b) => {
                        const tumblerCompare = (a.tumblerName || '').localeCompare(b.tumblerName || '');
                        if (tumblerCompare !== 0) return tumblerCompare;
                        return a.barrelNumber - b.barrelNumber;
                      }).map(barrel => (
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

                {/* Start Date/Time */}
                <div className="space-y-2">
                  <Label>Start Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={stageStartDateTime}
                    onChange={(e) => setStageStartDateTime(e.target.value)}
                  />
                  {!isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      {cycle.stageRuns.length === 0
                        ? 'First stage defaults to cycle start date'
                        : 'Defaults to current date/time'}
                    </p>
                  )}
                </div>

                {/* Duration - Collapsible */}
                <div className="border rounded-lg p-3 space-y-3">
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-between h-auto p-0 hover:bg-transparent"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Duration</span>
                          {(parseInt(durationDays) > 0 || parseInt(durationHours) > 0) && (
                            <span className="text-muted-foreground text-sm">
                              ({durationDays}d {durationHours}h)
                            </span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4">
                      <DurationPicker
                        durationDays={durationDays}
                        durationHours={durationHours}
                        onDaysChange={setDurationDays}
                        onHoursChange={setDurationHours}
                        startDateTime={stageStartDateTime}
                        hideLabel
                      />

                      {/* Reminder Settings */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="reminderEnabled"
                            checked={reminderEnabled}
                            onCheckedChange={(checked) => setReminderEnabled(checked as boolean)}
                          />
                          <Label htmlFor="reminderEnabled">Set a reminder to check this stage</Label>
                        </div>
                        {reminderEnabled && (
                          <div className="ml-6 space-y-2">
                            <RadioGroup value={reminderType} onValueChange={(v) => setReminderType(v as 'afterDays' | 'atEnd')}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="afterDays" id="afterDays" />
                                <Label htmlFor="afterDays" className="flex items-center gap-2">
                                  Remind after
                                  <Input
                                    type="number"
                                    min="1"
                                    className="w-16 h-8"
                                    value={remindAfterDays}
                                    onChange={(e) => setRemindAfterDays(e.target.value)}
                                    disabled={reminderType !== 'afterDays'}
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
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Load Weight Before */}
                <WeightInput
                  label="Load Weight Before"
                  valueGrams={loadWeightBeforeGrams}
                  onValueChange={setLoadWeightBeforeGrams}
                  barrelCapacityLbs={selectedBarrelCapacityLbs > 0 ? selectedBarrelCapacityLbs : undefined}
                  onValidationChange={(isValid) => setWeightBeforeValidationError(!isValid)}
                />

                {/* Water Amount */}
                <div className="space-y-2">
                  <Label>Water Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 250"
                      value={waterAmount}
                      onChange={(e) => setWaterAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={waterUnit} onValueChange={setWaterUnit}>
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

                {/* Materials Section */}
                <StageMaterialsSection
                  materials={selectedMaterials}
                  availableMaterials={materials || []}
                  onMaterialsChange={setSelectedMaterials}
                />

                {/* Material Notes */}
                <div className="space-y-2">
                  <Label>Material Notes (optional)</Label>
                  <Textarea
                    placeholder="Any notes about materials or this stage..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Cleaning Run Section */}
                <CleaningRunSection
                  data={{
                    enabled: addCleaningRun,
                    durationDays: cleaningDurationDays,
                    durationHours: cleaningDurationHours,
                    durationMinutes: cleaningDurationMinutes,
                    purpose: cleaningPurpose,
                    notes: cleaningNotes,
                    materials: cleaningMaterials,
                  }}
                  availableMaterials={materials || []}
                  onChange={(data) => {
                    setAddCleaningRun(data.enabled);
                    setCleaningDurationDays(data.durationDays);
                    setCleaningDurationHours(data.durationHours);
                    setCleaningDurationMinutes(data.durationMinutes);
                    setCleaningPurpose(data.purpose);
                    setCleaningNotes(data.notes);
                    setCleaningMaterials(data.materials);
                  }}
                />

              </div>
            </div>

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending || isLoading}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create Stage'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
