'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { cycleApi } from '@/lib/api';

// Helper to extract error message from Axios or generic errors
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; details?: string } | undefined;
    return data?.details || data?.message || error.message || 'Unknown error';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
import { Card, CardContent } from '@/components/ui/card';
import { StageMaterialsSection } from '@/components/stage/stage-materials-section';
import { CleaningRunSection } from '@/components/stage/cleaning-run-section';
import { toast } from 'sonner';
import {
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Droplets,
  Bell,
  FileText,
  Sparkles,
  Cylinder,
  Star,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DurationPicker } from '@/components/duration-picker';
import { WeightInput } from '@/components/weight-input';
import { useSettings, useTimezone } from '@/hooks/use-user';
import { useAuth } from '@/providers/auth-provider';
import { formatDateTimeLocal, isStageStartBeforeCycleStart, calculateDurationFromDates } from '@/lib/date-utils';
import { convertMinutesToDaysHoursMinutes } from '@/lib/duration-utils';
import type { StageRunDto, CreateStageMaterialRequest, CreateCleaningMaterialRequest } from '@/types/cycle';
import { type StageFormProps, STAGE_NAMES, WATER_UNITS } from './types';

export function StageFormMobile({
  open,
  onOpenChange,
  cycleId,
  cycle,
  stageRunId,
  allBarrels,
  materials,
  onSuccess,
}: StageFormProps) {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const { toUserTz, now: getNow, formatForInput } = useTimezone();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const isEditMode = !!stageRunId;

  // Collapsible sections
  const [stageNameOpen, setStageNameOpen] = useState(!isEditMode);
  const [barrelsOpen, setBarrelsOpen] = useState(!isEditMode);
  const [durationOpen, setDurationOpen] = useState(true);

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

  // Completion fields (for editing completed stages)
  const [stageStatus, setStageStatus] = useState<string>('');
  const [resultRating, setResultRating] = useState<number>(0);
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [loadWeightAfterGrams, setLoadWeightAfterGrams] = useState<number | null>(null);
  const [issueScratches, setIssueScratches] = useState(false);
  const [issueChips, setIssueChips] = useState(false);
  const [issueUnderRounded, setIssueUnderRounded] = useState(false);
  const [issueContamination, setIssueContamination] = useState(false);

  // Cleaning run state
  const [addCleaningRun, setAddCleaningRun] = useState(false);
  const [cleaningDurationDays, setCleaningDurationDays] = useState<string>('0');
  const [cleaningDurationHours, setCleaningDurationHours] = useState<string>('0');
  const [cleaningDurationMinutes, setCleaningDurationMinutes] = useState<string>('0');
  const [cleaningPurpose, setCleaningPurpose] = useState<string>('');
  const [cleaningMaterials, setCleaningMaterials] = useState<Array<{ materialId: string; displayAmount: string; displayUnit: string }>>([]);

  // Calculate total barrel capacity
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
    setCleaningMaterials([]);
    // Completion fields
    setStageStatus('');
    setResultRating(0);
    setLessonsLearned('');
    setLoadWeightAfterGrams(null);
    setIssueScratches(false);
    setIssueChips(false);
    setIssueUnderRounded(false);
    setIssueContamination(false);
    setIsLoading(false);
  }, [settings?.measurementSystem]);

  // Load existing stage data when editing
  const loadStageData = useCallback(async (stageId: string) => {
    setIsLoading(true);
    try {
      const fullStage: StageRunDto = await cycleApi.getStageRun(stageId);

      const standardNames = STAGE_NAMES.slice(0, -1);
      setStageName(standardNames.includes(fullStage.stageName) ? fullStage.stageName : 'Custom');
      setCustomStageName(!standardNames.includes(fullStage.stageName) ? fullStage.stageName : '');

      setStageStartDateTime(formatForInput(fullStage.startDateTime));

      const startDateInTz = toUserTz(fullStage.startDateTime);
      const endDateString = fullStage.endDateTime ?? fullStage.durationEstimateEndDate;
      const endDateInTz = endDateString ? toUserTz(endDateString) : getNow();
      const { days, hours } = calculateDurationFromDates(startDateInTz!, endDateInTz!);
      setDurationDays(String(days));
      setDurationHours(String(hours));

      setNotes(fullStage.notes || '');

      if (fullStage.barrels && fullStage.barrels.length > 0) {
        setSelectedBarrelIds(fullStage.barrels.map(b => b.barrelId));
      }

      if (fullStage.materials && fullStage.materials.length > 0) {
        setSelectedMaterials(fullStage.materials.map(m => ({
          materialId: m.materialId,
          displayAmount: m.displayAmount?.toString() || '',
          displayUnit: m.displayUnit || 'tbsp',
        })));
      }

      setReminderEnabled(fullStage.reminderEnabled);
      if (fullStage.remindAfterDays) {
        setReminderType('afterDays');
        setRemindAfterDays(String(fullStage.remindAfterDays));
      } else if (fullStage.remindAtEndOfStage) {
        setReminderType('atEnd');
      }

      setLoadWeightBeforeGrams(fullStage.loadWeightBeforeGrams);
      const preferredWaterUnit = settings?.measurementSystem === 'Imperial' ? 'floz' : 'ml';
      setWaterUnit(preferredWaterUnit);
      if (fullStage.waterAmountMl) {
        const displayValue = preferredWaterUnit === 'floz'
          ? (fullStage.waterAmountMl / 29.5735).toFixed(1)
          : fullStage.waterAmountMl.toString();
        setWaterAmount(displayValue);
      }

      if (fullStage.cleaningRun) {
        setAddCleaningRun(true);
        const { days, hours, mins } = convertMinutesToDaysHoursMinutes(fullStage.cleaningRun.durationMinutes);
        setCleaningDurationDays(String(days));
        setCleaningDurationHours(String(hours));
        setCleaningDurationMinutes(String(mins));
        setCleaningPurpose(fullStage.cleaningRun.purpose || '');
        if (fullStage.cleaningRun.materials && fullStage.cleaningRun.materials.length > 0) {
          setCleaningMaterials(fullStage.cleaningRun.materials.map(m => ({
            materialId: m.materialId,
            displayAmount: m.displayAmount?.toString() || '',
            displayUnit: m.displayUnit || 'tbsp',
          })));
        }
      }

      // Completion fields (for completed stages)
      setStageStatus(fullStage.status);
      if (fullStage.status === 'Completed') {
        setResultRating(fullStage.resultRating || 0);
        setLessonsLearned(fullStage.lessonsLearned || '');
        setLoadWeightAfterGrams(fullStage.loadWeightAfterGrams);
        setIssueScratches(fullStage.issueScratches || false);
        setIssueChips(fullStage.issueChips || false);
        setIssueUnderRounded(fullStage.issueUnderRounded || false);
        setIssueContamination(fullStage.issueContamination || false);
      }
    } catch {
      toast.error('Failed to load stage data');
    } finally {
      setIsLoading(false);
    }
  }, [formatForInput, getNow, settings?.measurementSystem, toUserTz]);

  useEffect(() => {
    if (open) {
      // Set sections collapsed for edit, expanded for create
      setStageNameOpen(!isEditMode);
      setBarrelsOpen(!isEditMode);

      if (isEditMode && stageRunId) {
        loadStageData(stageRunId);
      } else {
        resetForm();
        if (cycle.stageRuns.length === 0) {
          const [year, month, day] = cycle.startDate.split('-').map(Number);
          const nowInTz = getNow();
          const startDate = new Date(year, month - 1, day, nowInTz.getHours(), nowInTz.getMinutes());
          setStageStartDateTime(formatDateTimeLocal(startDate));
        } else {
          setStageStartDateTime(formatDateTimeLocal(getNow()));
        }
        autoPopulateFromRepeat();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, stageRunId]);

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
          if (fullStage.cleaningRun.materials && fullStage.cleaningRun.materials.length > 0) {
            setCleaningMaterials(fullStage.cleaningRun.materials.map(m => ({
              materialId: m.materialId,
              displayAmount: m.displayAmount ? String(m.displayAmount) : '',
              displayUnit: m.displayUnit || 'tbsp',
            })));
          }
        }

        toast.info(`Auto-filled from previous "${fullStage.stageName}" stage`);
      }
    } catch {
      // Ignore
    }
  };

  const copyFromPreviousStage = async () => {
    if (cycle.stageRuns.length === 0) return;

    const previousStageSummary = cycle.stageRuns[cycle.stageRuns.length - 1];

    setIsCopyingFromPrevious(true);
    try {
      const previousStage: StageRunDto = await cycleApi.getStageRun(previousStageSummary.stageRunId);

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
        if (previousStage.cleaningRun.materials && previousStage.cleaningRun.materials.length > 0) {
          setCleaningMaterials(previousStage.cleaningRun.materials.map(m => ({
            materialId: m.materialId,
            displayAmount: m.displayAmount ? String(m.displayAmount) : '',
            displayUnit: m.displayUnit || 'tbsp',
          })));
        }
      }

      toast.success(`Copied from ${previousStage.stageName}`);
    } catch {
      toast.error('Failed to copy');
    } finally {
      setIsCopyingFromPrevious(false);
    }
  };

  const toggleBarrel = (barrelId: string) => {
    setSelectedBarrelIds(prev =>
      prev.includes(barrelId)
        ? prev.filter(id => id !== barrelId)
        : [...prev, barrelId]
    );
  };

  const addStageMutation = useMutation({
    mutationFn: (data: Parameters<typeof cycleApi.addStageRun>[1]) =>
      cycleApi.addStageRun(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Stage added');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: unknown) => {
      console.error('Failed to add stage:', error);
      if (isAdmin) {
        toast.error(`Failed to add stage: ${getErrorMessage(error)}`);
      } else {
        toast.error('Failed to save changes');
      }
    },
  });

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
    onError: (error: unknown) => {
      console.error('Failed to update stage:', error);
      if (isAdmin) {
        toast.error(`Failed to update stage: ${getErrorMessage(error)}`);
      } else {
        toast.error('Failed to save changes');
      }
    },
  });

  const handleSubmit = () => {
    const finalStageName = stageName === 'Custom' ? customStageName : stageName;

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
      toast.error('Stage start cannot be before cycle start');
      return;
    }
    if (weightBeforeValidationError) {
      toast.error('Weight exceeds capacity');
      return;
    }

    if (addCleaningRun) {
      const cleaningTotalMinutes = (parseInt(cleaningDurationDays) || 0) * 1440 + (parseInt(cleaningDurationHours) || 0) * 60 + (parseInt(cleaningDurationMinutes) || 0);
      if (cleaningTotalMinutes <= 0) {
        toast.error('Cleaning run needs duration');
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
        materials: cleaningMaterialsToSubmit.length > 0 ? cleaningMaterialsToSubmit : undefined,
      };
    }

    const payload: Parameters<typeof cycleApi.updateStageRun>[1] = {
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
    };

    // Include completion fields when editing completed stages
    if (isEditMode && stageStatus === 'Completed') {
      payload.resultRating = resultRating > 0 ? resultRating : undefined;
      payload.lessonsLearned = lessonsLearned || undefined;
      payload.loadWeightAfterGrams = loadWeightAfterGrams || undefined;
      // Send actual boolean values for issue fields (not || undefined, which converts false to undefined)
      payload.issueScratches = issueScratches;
      payload.issueChips = issueChips;
      payload.issueUnderRounded = issueUnderRounded;
      payload.issueContamination = issueContamination;
    }

    if (isEditMode) {
      updateStageMutation.mutate(payload);
    } else {
      // For create, barrelIds is required
      addStageMutation.mutate({
        ...payload,
        barrelIds: selectedBarrelIds,
      });
    }
  };

  const isPending = addStageMutation.isPending || updateStageMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 flex flex-col z-[60]" overlayClassName="z-[60]">
        {/* Header */}
        <SheetHeader className="p-4 border-b flex-shrink-0">
          <SheetTitle className="text-lg">
            {isEditMode ? 'Edit Stage' : 'New Stage'}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-4 space-y-6 min-w-0">
                {/* Stage Name Selection */}
                <Collapsible open={stageNameOpen} onOpenChange={setStageNameOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-4 rounded-t-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5" />
                          <span className="font-medium">
                            {stageName === 'Custom' && customStageName
                              ? customStageName
                              : stageName === 'Custom'
                              ? 'Custom Stage'
                              : stageName}
                          </span>
                        </div>
                        {stageNameOpen ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {STAGE_NAMES.slice(0, -1).map(name => (
                            <Button
                              key={name}
                              type="button"
                              variant={stageName === name ? 'default' : 'outline'}
                              className="h-12"
                              onClick={() => {
                                setStageName(name);
                                setCustomStageName('');
                              }}
                            >
                              {name}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            variant={stageName === 'Custom' || !STAGE_NAMES.slice(0, -1).includes(stageName) ? 'default' : 'outline'}
                            className="h-12"
                            onClick={() => {
                              setStageName('Custom');
                              setCustomStageName('');
                            }}
                          >
                            Custom
                          </Button>
                        </div>
                        {(stageName === 'Custom' || !STAGE_NAMES.slice(0, -1).includes(stageName)) && (
                          <Input
                            placeholder="Enter custom stage name..."
                            value={stageName === 'Custom' ? customStageName : stageName}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCustomStageName(value);
                              if (value) setStageName(value);
                              else setStageName('Custom');
                            }}
                            className="h-12 text-base"
                          />
                        )}
                        {!isEditMode && cycle.stageRuns.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={copyFromPreviousStage}
                            disabled={isCopyingFromPrevious}
                            className="w-full h-12"
                          >
                            {isCopyingFromPrevious ? (
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                              <Copy className="mr-2 h-5 w-5" />
                            )}
                            Copy from Previous
                          </Button>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Barrel Selection */}
                <Collapsible open={barrelsOpen} onOpenChange={setBarrelsOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-4 rounded-t-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Cylinder className="h-5 w-5" />
                          <span className="font-medium">
                            Select Barrel(s)
                            {selectedBarrelIds.length > 0 && (
                              <span className="text-muted-foreground font-normal ml-2">
                                ({selectedBarrelIds.length} selected)
                              </span>
                            )}
                          </span>
                        </div>
                        {barrelsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4 px-4">
                        <div className="space-y-2">
                          {allBarrels.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No active barrels available
                            </p>
                          ) : (
                            [...allBarrels].sort((a, b) => {
                              const tumblerCompare = (a.tumblerName || '').localeCompare(b.tumblerName || '');
                              if (tumblerCompare !== 0) return tumblerCompare;
                              return a.barrelNumber - b.barrelNumber;
                            }).map(barrel => {
                              const isSelected = selectedBarrelIds.includes(barrel.barrelId);
                              const isInOtherCycle = barrel.isInActiveCycle && barrel.activeCycleId !== cycleId;
                              return (
                                <button
                                  key={barrel.barrelId}
                                  type="button"
                                  onClick={() => toggleBarrel(barrel.barrelId)}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-4 rounded-lg border text-left active:bg-accent transition-colors",
                                    isSelected && "bg-primary/10 border-primary"
                                  )}
                                >
                                  <div className={cn(
                                    "w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                  )}>
                                    {isSelected && <Check className="h-5 w-5 text-primary-foreground" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium flex items-center gap-2">
                                      <span className={cn(
                                        "w-2 h-2 rounded-full flex-shrink-0",
                                        isInOtherCycle ? "bg-yellow-500" : "bg-green-500"
                                      )} />
                                      {barrel.tumblerName}
                                      {barrel.capacityLbs && (
                                        <span className="text-muted-foreground font-normal">
                                          {' '}- {barrel.capacityLbs} lbs
                                        </span>
                                      )}
                                      {' '}#{barrel.barrelNumber}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {barrel.nickname && <span>{barrel.nickname}</span>}
                                      {isInOtherCycle && barrel.activeCycleName && (
                                        <span className="text-yellow-600 dark:text-yellow-400">
                                          {barrel.nickname ? ' · ' : ''}In use: {barrel.activeCycleName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Start Date/Time */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Start Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={stageStartDateTime}
                    onChange={(e) => setStageStartDateTime(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                {/* Duration Section */}
                <Collapsible open={durationOpen} onOpenChange={setDurationOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5" />
                        <span className="font-medium">Duration</span>
                        {(parseInt(durationDays) > 0 || parseInt(durationHours) > 0) && (
                          <span className="text-muted-foreground">
                            {durationDays}d {durationHours}h
                          </span>
                        )}
                      </div>
                      {durationOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <DurationPicker
                      durationDays={durationDays}
                      durationHours={durationHours}
                      onDaysChange={setDurationDays}
                      onHoursChange={setDurationHours}
                      startDateTime={stageStartDateTime}
                      hideLabel
                    />

                    {/* Reminder */}
                    <div className="space-y-3 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setReminderEnabled(!reminderEnabled)}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-lg border text-left",
                          reminderEnabled && "bg-primary/10 border-primary"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-md border-2 flex items-center justify-center",
                          reminderEnabled ? "bg-primary border-primary" : "border-muted-foreground/30"
                        )}>
                          {reminderEnabled && <Check className="h-5 w-5 text-primary-foreground" />}
                        </div>
                        <Bell className="h-5 w-5" />
                        <span>Set reminder</span>
                      </button>

                      {reminderEnabled && (
                        <div className="space-y-2 ml-10">
                          <button
                            type="button"
                            onClick={() => setReminderType('atEnd')}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg border text-left",
                              reminderType === 'atEnd' && "bg-primary/10 border-primary"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              reminderType === 'atEnd' ? "border-primary" : "border-muted-foreground/30"
                            )}>
                              {reminderType === 'atEnd' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <span>At end of stage</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setReminderType('afterDays')}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border text-left flex-1",
                                reminderType === 'afterDays' && "bg-primary/10 border-primary"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                reminderType === 'afterDays' ? "border-primary" : "border-muted-foreground/30"
                              )}>
                                {reminderType === 'afterDays' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                              </div>
                              <span>After</span>
                            </button>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              value={remindAfterDays}
                              onChange={(e) => setRemindAfterDays(e.target.value)}
                              disabled={reminderType !== 'afterDays'}
                              className="w-20 h-12"
                            />
                            <span>days</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Materials Section */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Materials
                  </Label>
                  <StageMaterialsSection
                    materials={selectedMaterials}
                    availableMaterials={materials || []}
                    onMaterialsChange={setSelectedMaterials}
                  />
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
                  <Label className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Water Amount
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 250"
                      value={waterAmount}
                      onChange={(e) => setWaterAmount(e.target.value)}
                      className="flex-1 h-12"
                    />
                    <Select value={waterUnit} onValueChange={setWaterUnit}>
                      <SelectTrigger className="w-24 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[70]">
                        {WATER_UNITS.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Any notes about this stage..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="text-base"
                  />
                </div>

                {/* Cleaning Run */}
                <CleaningRunSection
                  data={{
                    enabled: addCleaningRun,
                    durationDays: cleaningDurationDays,
                    durationHours: cleaningDurationHours,
                    durationMinutes: cleaningDurationMinutes,
                    purpose: cleaningPurpose,
                    materials: cleaningMaterials,
                  }}
                  availableMaterials={materials || []}
                  onChange={(data) => {
                    setAddCleaningRun(data.enabled);
                    setCleaningDurationDays(data.durationDays);
                    setCleaningDurationHours(data.durationHours);
                    setCleaningDurationMinutes(data.durationMinutes);
                    setCleaningPurpose(data.purpose);
                    setCleaningMaterials(data.materials);
                  }}
                />

                {/* Completion Fields - Only shown when editing completed stages */}
                {stageStatus === 'Completed' && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg [&[data-state=open]>svg:last-child]:rotate-180"
                      >
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          <span className="font-medium">Completion Details</span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4 border rounded-lg p-4">
                      {/* Result Rating */}
                      <div className="space-y-2">
                        <Label id="mobile-stage-result-rating-label">Stage Result Rating</Label>
                        <div
                          className="flex gap-1"
                          role="radiogroup"
                          aria-labelledby="mobile-stage-result-rating-label"
                        >
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setResultRating(star)}
                              className="p-1.5 hover:scale-110 transition-transform"
                              role="radio"
                              aria-checked={star === resultRating}
                              aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                            >
                              <Star
                                className={`h-7 w-7 ${star <= resultRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 self-center text-sm text-muted-foreground">
                            {resultRating > 0 ? `${resultRating}/5` : 'Tap to rate'}
                          </span>
                        </div>
                      </div>

                      {/* Weight After */}
                      <WeightInput
                        label="Weight After"
                        helperText={
                          loadWeightBeforeGrams
                            ? `(Before: ${settings?.measurementSystem === 'Metric'
                                ? `${(loadWeightBeforeGrams / 1000).toFixed(2)} kg`
                                : `${(loadWeightBeforeGrams / 453.592).toFixed(1)} lbs`})`
                            : "(optional)"
                        }
                        valueGrams={loadWeightAfterGrams}
                        onValueChange={setLoadWeightAfterGrams}
                        barrelCapacityLbs={selectedBarrelCapacityLbs || undefined}
                      />

                      {/* Issues */}
                      <div className="space-y-3">
                        <Label>Any issues? (check all that apply)</Label>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox id="mobile-issueScratches" checked={issueScratches} onCheckedChange={(c) => setIssueScratches(c as boolean)} />
                            <Label htmlFor="mobile-issueScratches" className="text-sm">Scratches</Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Checkbox id="mobile-issueChips" checked={issueChips} onCheckedChange={(c) => setIssueChips(c as boolean)} />
                            <Label htmlFor="mobile-issueChips" className="text-sm">Chips/Bruises</Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Checkbox id="mobile-issueUnderRounded" checked={issueUnderRounded} onCheckedChange={(c) => setIssueUnderRounded(c as boolean)} />
                            <Label htmlFor="mobile-issueUnderRounded" className="text-sm">Under-rounded</Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Checkbox id="mobile-issueContamination" checked={issueContamination} onCheckedChange={(c) => setIssueContamination(c as boolean)} />
                            <Label htmlFor="mobile-issueContamination" className="text-sm">Grit contamination</Label>
                          </div>
                        </div>
                      </div>

                      {/* Lessons Learned */}
                      <div className="space-y-2">
                        <Label>Lessons Learned</Label>
                        <Textarea
                          placeholder="What would you do differently next time?"
                          value={lessonsLearned}
                          onChange={(e) => setLessonsLearned(e.target.value)}
                          rows={3}
                          className="h-24"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

              </div>
            </div>

            {/* Footer */}
            <SheetFooter className="border-t p-4 flex-shrink-0">
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || isLoading}
                  className="flex-1 h-12"
                >
                  {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isEditMode ? 'Save' : 'Create Stage'}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
