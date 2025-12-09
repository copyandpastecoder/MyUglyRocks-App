'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi, tumblerApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
  Trash2,
  Play,
  Share2,
  X,
  Star,
  ChevronDown,
  ChevronUp,
  Pencil,
  Copy,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import { CyclePhotos } from '@/components/cycle-photos';
import { DurationPicker } from '@/components/duration-picker';
import { WeightInput } from '@/components/weight-input';
import { CleaningRunModal } from '@/components/cleaning-run-modal';
import { useSettings } from '@/hooks/use-user';
import { useMaterials } from '@/hooks/use-materials';
import type { StageRunSummaryDto, StageRunDto, CreateStageMaterialRequest, CreateCleaningMaterialRequest, CompleteStageRunRequest, UpdateCycleRequest, UpdateStageRunRequest, CleaningRunDto } from '@/types/cycle';
import type { BarrelDto } from '@/types/tumbler';

const STAGE_NAMES = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish', 'Custom'];
const WATER_UNITS = [
  { value: 'ml', label: 'ml' },
  { value: 'floz', label: 'fl oz' },
];
const CLEANING_PURPOSES = [
  { value: 'PostStageClean', label: 'Post-Stage Clean' },
  { value: 'PrePolishClean', label: 'Pre-Polish Clean' },
  { value: 'FinalBurnish', label: 'Final Burnish' },
  { value: 'GritRemoval', label: 'Grit Removal' },
];

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const cycleId = params.id as string;

  // Track if we've already handled the addStage query param
  const [hasHandledAddStage, setHasHandledAddStage] = useState(false);

  // Add Stage Dialog State
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
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
  const [fillLevelPercent, setFillLevelPercent] = useState<string>('');
  const [waterAmount, setWaterAmount] = useState<string>('');
  const [waterUnit, setWaterUnit] = useState<string>('ml');
  // State for Copy from Previous
  const [isCopyingFromPrevious, setIsCopyingFromPrevious] = useState(false);
  // Cleaning Run state for Add Stage modal
  const [addCleaningRun, setAddCleaningRun] = useState(false);
  const [cleaningDurationDays, setCleaningDurationDays] = useState<string>('0');
  const [cleaningDurationHours, setCleaningDurationHours] = useState<string>('0');
  const [cleaningDurationMinutes, setCleaningDurationMinutes] = useState<string>('0');
  const [cleaningPurpose, setCleaningPurpose] = useState<string>('');
  const [cleaningNotes, setCleaningNotes] = useState<string>('');
  const [cleaningMaterials, setCleaningMaterials] = useState<Array<{ materialId: string; displayAmount: string; displayUnit: string }>>([]);

  // Complete Stage Modal State
  const [isCompleteStageOpen, setIsCompleteStageOpen] = useState(false);
  const [completeStageId, setCompleteStageId] = useState<string | null>(null);
  const [completeStageName, setCompleteStageName] = useState<string>('');
  const [completeStageRunNumber, setCompleteStageRunNumber] = useState<number>(1);
  const [completeStageTotalRuns, setCompleteStageTotalRuns] = useState<number>(1);
  const [completeStageStartDateTime, setCompleteStageStartDateTime] = useState<string>('');
  const [completeStageDurationDays, setCompleteStageDurationDays] = useState<string>('7');
  const [completeStageDurationHours, setCompleteStageDurationHours] = useState<string>('0');
  const [resultRating, setResultRating] = useState<number>(0);
  const [showAdvancedQuality, setShowAdvancedQuality] = useState(false);
  const [resultShapeRounding, setResultShapeRounding] = useState<number>(50);
  const [resultScratchLevel, setResultScratchLevel] = useState<number>(50);
  const [resultPitting, setResultPitting] = useState<number>(50);
  const [resultShine, setResultShine] = useState<number>(50);
  const [issueScratches, setIssueScratches] = useState(false);
  const [issueChips, setIssueChips] = useState(false);
  const [issueUnderRounded, setIssueUnderRounded] = useState(false);
  const [issueContamination, setIssueContamination] = useState(false);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [nextAction, setNextAction] = useState<string>('Advance');
  const [loadWeightAfterGrams, setLoadWeightAfterGrams] = useState<number | null>(null);
  const [weightAfterValidationError, setWeightAfterValidationError] = useState(false);
  // Barrel capacity for the stage being completed (for validation)
  const [completeStageBarrelCapacity, setCompleteStageBarrelCapacity] = useState<number | null>(null);
  // Cleaning run info for Complete Stage modal (read-only display)
  const [completeStageCleaningRun, setCompleteStageCleaningRun] = useState<CleaningRunDto | null>(null);
  // Weight before (from when stage was started)
  const [completeStageWeightBefore, setCompleteStageWeightBefore] = useState<number | null>(null);

  // Edit Cycle Dialog State
  const [isEditCycleOpen, setIsEditCycleOpen] = useState(false);
  const [editCycleName, setEditCycleName] = useState('');
  const [editCycleStartDate, setEditCycleStartDate] = useState('');
  const [editCycleGoal, setEditCycleGoal] = useState('');
  const [editCycleNotes, setEditCycleNotes] = useState('');

  // Edit Stage Dialog State
  const [isEditStageOpen, setIsEditStageOpen] = useState(false);
  const [editStageId, setEditStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState('');
  const [editCustomStageName, setEditCustomStageName] = useState('');
  const [editStageStartDateTime, setEditStageStartDateTime] = useState('');
  const [editStageDurationDays, setEditStageDurationDays] = useState('');
  const [editStageDurationHours, setEditStageDurationHours] = useState('');
  const [editStageNotes, setEditStageNotes] = useState('');

  // Cleaning Run Modal State
  const [isCleaningRunOpen, setIsCleaningRunOpen] = useState(false);
  const [cleaningRunStageId, setCleaningRunStageId] = useState<string | null>(null);
  const [cleaningRunStageName, setCleaningRunStageName] = useState('');

  const { data: cycle, isLoading: cycleLoading } = useQuery({
    queryKey: ['cycle', cycleId],
    queryFn: () => cycleApi.getById(cycleId),
  });

  const { data: tumblers } = useQuery({
    queryKey: ['tumblers', 'withBarrels'],
    queryFn: tumblerApi.getAllWithBarrels,
  });

  const { data: settings } = useSettings();
  const { data: materials } = useMaterials();

  // Auto-open Add Stage dialog when ?addStage=true query param is present
  useEffect(() => {
    const shouldOpenAddStage = searchParams.get('addStage') === 'true';
    if (shouldOpenAddStage && cycle && cycle.status === 'Active' && !hasHandledAddStage) {
      setHasHandledAddStage(true);
      // Use setTimeout to ensure all data is ready
      setTimeout(async () => {
        await openAddStageModal();
        // Remove the query param from URL to prevent re-opening on page refresh
        router.replace(`/cycles/${cycleId}`, { scroll: false });
      }, 100);
    }
  }, [searchParams, cycle, hasHandledAddStage, cycleId, router]);

  const addStageMutation = useMutation({
    mutationFn: (data: {
      barrelIds: string[];
      stageName: string;
      startDateTime: string;
      durationDays: number;
      durationHours: number;
      notes?: string;
      reminderEnabled: boolean;
      remindAfterDays?: number;
      remindAtEndOfStage?: boolean;
      loadWeightBeforeGrams?: number;
      fillLevelPercent?: number;
      waterLevel?: string;
      waterAmountMl?: number;
      materials?: CreateStageMaterialRequest[];
      cleaningRun?: {
        durationMinutes: number;
        purpose?: string;
        reminderEnabled?: boolean;
        notes?: string;
        materials?: CreateCleaningMaterialRequest[];
      };
    }) =>
      cycleApi.addStageRun(cycleId, {
        barrelIds: data.barrelIds,
        stageName: data.stageName,
        startDateTime: data.startDateTime,
        durationDays: data.durationDays,
        durationHours: data.durationHours,
        notes: data.notes,
        reminderEnabled: data.reminderEnabled,
        remindAfterDays: data.remindAfterDays,
        remindAtEndOfStage: data.remindAtEndOfStage,
        loadWeightBeforeGrams: data.loadWeightBeforeGrams,
        fillLevelPercent: data.fillLevelPercent,
        waterLevel: data.waterLevel,
        waterAmountMl: data.waterAmountMl,
        materials: data.materials,
        cleaningRun: data.cleaningRun,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Stage added successfully');
      setIsAddStageOpen(false);
      resetAddStageForm();
    },
    onError: () => {
      toast.error('Failed to add stage');
    },
  });

  const deleteStageRunMutation = useMutation({
    mutationFn: cycleApi.deleteStageRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Stage deleted');
    },
    onError: () => {
      toast.error('Failed to delete stage');
    },
  });

  const completeStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteStageRunRequest }) =>
      cycleApi.completeStageRun(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Stage completed');
      setIsCompleteStageOpen(false);
      resetCompleteStageForm();
    },
    onError: () => {
      toast.error('Failed to complete stage');
    },
  });

  const updateCycleMutation = useMutation({
    mutationFn: (data: UpdateCycleRequest) => cycleApi.update(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Cycle updated');
      setIsEditCycleOpen(false);
    },
    onError: () => {
      toast.error('Failed to update cycle');
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStageRunRequest }) =>
      cycleApi.updateStageRun(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Stage updated');
      setIsEditStageOpen(false);
      setEditStageId(null);
    },
    onError: () => {
      toast.error('Failed to update stage');
    },
  });

  const resetAddStageForm = () => {
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
    setFillLevelPercent('');
    setWaterAmount('');
    // Set water unit based on user preference
    setWaterUnit(settings?.measurementSystem === 'Imperial' ? 'floz' : 'ml');
    // Reset cleaning run state
    setAddCleaningRun(false);
    setCleaningDurationDays('0');
    setCleaningDurationHours('0');
    setCleaningDurationMinutes('0');
    setCleaningPurpose('');
    setCleaningNotes('');
    setCleaningMaterials([]);
  };

  const resetCompleteStageForm = () => {
    setCompleteStageId(null);
    setCompleteStageName('');
    setCompleteStageRunNumber(1);
    setCompleteStageTotalRuns(1);
    setCompleteStageStartDateTime('');
    setCompleteStageDurationDays('7');
    setCompleteStageDurationHours('0');
    setResultRating(0);
    setShowAdvancedQuality(false);
    setResultShapeRounding(50);
    setResultScratchLevel(50);
    setResultPitting(50);
    setResultShine(50);
    setIssueScratches(false);
    setIssueChips(false);
    setIssueUnderRounded(false);
    setIssueContamination(false);
    setLessonsLearned('');
    setNextAction('Advance');
    setLoadWeightAfterGrams(null);
    setWeightAfterValidationError(false);
    setCompleteStageBarrelCapacity(null);
    setCompleteStageCleaningRun(null);
    setCompleteStageWeightBefore(null);
  };

  const handleAddStage = () => {
    if (selectedBarrelIds.length === 0) {
      toast.error('Please select at least one barrel');
      return;
    }
    if (!stageStartDateTime) {
      toast.error('Please set a start date/time');
      return;
    }
    // Validate stage name (don't allow "Custom" as the actual name)
    if (stageName === 'Custom' || !stageName.trim()) {
      toast.error('Please enter a stage name');
      return;
    }

    // Validate stage start date is not before cycle start date
    if (cycle) {
      const cycleStartDate = new Date(cycle.startDate);
      const stageStart = new Date(stageStartDateTime);
      cycleStartDate.setHours(0, 0, 0, 0);
      const stageStartDateOnly = new Date(stageStart);
      stageStartDateOnly.setHours(0, 0, 0, 0);
      if (stageStartDateOnly < cycleStartDate) {
        toast.error('Stage start date cannot be before the cycle start date');
        return;
      }
    }

    // Validate weight before if entered
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

    addStageMutation.mutate({
      barrelIds: selectedBarrelIds,
      stageName,
      startDateTime: new Date(stageStartDateTime).toISOString(),
      durationDays: parseInt(durationDays) || 0,
      durationHours: parseInt(durationHours) || 0,
      notes: notes || undefined,
      reminderEnabled,
      remindAfterDays: reminderType === 'afterDays' ? parseInt(remindAfterDays) : undefined,
      remindAtEndOfStage: reminderType === 'atEnd' ? true : undefined,
      loadWeightBeforeGrams: loadWeightBeforeGrams || undefined,
      fillLevelPercent: fillLevelPercent ? parseInt(fillLevelPercent) : undefined,
      // Convert water amount to ml (1 fl oz = 29.5735 ml)
      waterAmountMl: waterAmount ? Math.round(parseFloat(waterAmount) * (waterUnit === 'floz' ? 29.5735 : 1)) : undefined,
      materials: materialsToSubmit.length > 0 ? materialsToSubmit : undefined,
      cleaningRun: cleaningRunRequest,
    });
  };

  // Helper to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Helper to combine a date string (YYYY-MM-DD) with current time
  // This avoids UTC timezone issues when parsing date-only strings
  const combineDateWithCurrentTime = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const now = new Date();
    return new Date(year, month - 1, day, now.getHours(), now.getMinutes());
  };

  const openAddStageModal = async () => {
    resetAddStageForm();
    // First stage uses cycle start date with current time, subsequent stages use "now"
    if (cycle && cycle.stageRuns.length === 0) {
      // First stage: use cycle's start date with current time
      setStageStartDateTime(formatDateTimeLocal(combineDateWithCurrentTime(cycle.startDate)));
    } else {
      // Subsequent stages: default to now
      setStageStartDateTime(formatDateTimeLocal(new Date()));
    }
    setIsAddStageOpen(true);

    // Check if the last completed stage had "Repeat" as next action - if so, auto-populate
    if (cycle && cycle.stageRuns.length > 0) {
      const lastCompletedStage = [...cycle.stageRuns]
        .reverse()
        .find(s => s.status === 'Completed');

      if (lastCompletedStage) {
        try {
          const fullStage: StageRunDto = await cycleApi.getStageRun(lastCompletedStage.id);
          if (fullStage.nextAction === 'Repeat') {
            // Auto-populate from the repeated stage (excluding advanced options)
            setStageName(fullStage.stageName);

            // Set start date to previous stage's end date
            const previousEndDate = new Date(fullStage.endDateTime);
            setStageStartDateTime(formatDateTimeLocal(previousEndDate));

            // Copy barrels
            if (fullStage.barrels && fullStage.barrels.length > 0) {
              const previousBarrelIds = fullStage.barrels.map(b => b.id);
              // Only select barrels that are still active
              const activeBarrelIds = previousBarrelIds.filter(id =>
                allBarrels.some(b => b.id === id)
              );
              setSelectedBarrelIds(activeBarrelIds);
            }

            // Copy materials
            if (fullStage.materials && fullStage.materials.length > 0) {
              const copiedMaterials = fullStage.materials.map(m => ({
                materialId: m.materialId,
                displayAmount: m.displayAmount ? String(m.displayAmount) : '',
                displayUnit: m.displayUnit || 'tbsp',
              }));
              setSelectedMaterials(copiedMaterials);
            }

            // Copy duration
            setDurationDays(String(fullStage.durationDays));
            setDurationHours(String(fullStage.durationHours));

            // Copy notes
            if (fullStage.notes) {
              setNotes(fullStage.notes);
            }

            // Copy cleaning run if present
            if (fullStage.cleaningRun) {
              setAddCleaningRun(true);
              const cleaningMinutes = fullStage.cleaningRun.durationMinutes;
              setCleaningDurationDays(String(Math.floor(cleaningMinutes / 1440)));
              setCleaningDurationHours(String(Math.floor((cleaningMinutes % 1440) / 60)));
              setCleaningDurationMinutes(String(cleaningMinutes % 60));
              setCleaningPurpose(fullStage.cleaningRun.purpose || 'PostStageClean');
              setCleaningNotes(fullStage.cleaningRun.notes || '');
              if (fullStage.cleaningRun.materials && fullStage.cleaningRun.materials.length > 0) {
                const copiedCleaningMaterials = fullStage.cleaningRun.materials.map(m => ({
                  materialId: m.materialId,
                  displayAmount: m.displayAmount ? String(m.displayAmount) : '',
                  displayUnit: m.displayUnit || 'tbsp',
                }));
                setCleaningMaterials(copiedCleaningMaterials);
              }
            }

            toast.info(`Auto-filled from previous "${fullStage.stageName}" stage (marked for repeat)`);
          }
        } catch {
          // Ignore error - just don't auto-populate
        }
      }
    }
  };

  // Copy settings from previous stage run
  const copyFromPreviousStage = async () => {
    if (!cycle || cycle.stageRuns.length === 0) return;

    // Find the most recent stage (last one in the list, whether completed or active)
    const previousStageSummary = cycle.stageRuns[cycle.stageRuns.length - 1];

    setIsCopyingFromPrevious(true);
    try {
      // Fetch full details of the previous stage
      const previousStage: StageRunDto = await cycleApi.getStageRun(previousStageSummary.id);

      // Set start date to previous stage's end date
      const previousEndDate = new Date(previousStage.endDateTime);
      setStageStartDateTime(formatDateTimeLocal(previousEndDate));

      // Copy barrels
      if (previousStage.barrels && previousStage.barrels.length > 0) {
        const previousBarrelIds = previousStage.barrels.map(b => b.id);
        // Only select barrels that are still active
        const activeBarrelIds = previousBarrelIds.filter(id =>
          allBarrels.some(b => b.id === id)
        );
        setSelectedBarrelIds(activeBarrelIds);
      }

      // Copy materials if same stage type
      if (stageName === previousStage.stageName && previousStage.materials && previousStage.materials.length > 0) {
        const copiedMaterials = previousStage.materials.map(m => ({
          materialId: m.materialId,
          displayAmount: m.displayAmount ? String(m.displayAmount) : '',
          displayUnit: m.displayUnit || 'tbsp',
        }));
        setSelectedMaterials(copiedMaterials);
      }

      // Copy duration
      setDurationDays(String(previousStage.durationDays));
      setDurationHours(String(previousStage.durationHours));

      // Copy cleaning run if present
      if (previousStage.cleaningRun) {
        setAddCleaningRun(true);
        const cleaningMinutes = previousStage.cleaningRun.durationMinutes;
        setCleaningDurationDays(String(Math.floor(cleaningMinutes / 1440)));
        setCleaningDurationHours(String(Math.floor((cleaningMinutes % 1440) / 60)));
        setCleaningDurationMinutes(String(cleaningMinutes % 60));
        setCleaningPurpose(previousStage.cleaningRun.purpose || 'PostStageClean');
        setCleaningNotes(previousStage.cleaningRun.notes || '');
        if (previousStage.cleaningRun.materials && previousStage.cleaningRun.materials.length > 0) {
          const copiedCleaningMaterials = previousStage.cleaningRun.materials.map(m => ({
            materialId: m.materialId,
            displayAmount: m.displayAmount ? String(m.displayAmount) : '',
            displayUnit: m.displayUnit || 'tbsp',
          }));
          setCleaningMaterials(copiedCleaningMaterials);
        }
      }

      toast.success(`Copied settings from previous ${previousStage.stageName} stage`);
    } catch {
      toast.error('Failed to copy from previous stage');
    } finally {
      setIsCopyingFromPrevious(false);
    }
  };

  const openCompleteStageModal = async (stage: StageRunSummaryDto) => {
    const startDate = new Date(stage.startDateTime);
    const endDate = new Date(stage.endDateTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    const totalHours = Math.round(durationMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    setCompleteStageId(stage.id);
    setCompleteStageName(stage.stageName);
    setCompleteStageRunNumber(stage.runNumber);
    setCompleteStageTotalRuns(stage.totalRuns);
    setCompleteStageStartDateTime(stage.startDateTime.slice(0, 16)); // Format for display
    setCompleteStageDurationDays(String(days));
    setCompleteStageDurationHours(String(hours));
    // Store cleaning run info for display
    setCompleteStageCleaningRun(stage.cleaningRun);
    setIsCompleteStageOpen(true);

    // Fetch full stage details to get weight before and barrel capacity
    try {
      const fullStage: StageRunDto = await cycleApi.getStageRun(stage.id);
      setCompleteStageWeightBefore(fullStage.loadWeightBeforeGrams);
      // Calculate total barrel capacity
      if (fullStage.barrels && fullStage.barrels.length > 0) {
        const totalCapacity = fullStage.barrels.reduce((sum, b) => sum + (b.capacityLbs || 0), 0);
        setCompleteStageBarrelCapacity(totalCapacity > 0 ? totalCapacity : null);
      }
    } catch {
      // Ignore error - weight before is optional
    }
  };

  const handleCompleteStage = () => {
    if (!completeStageId) return;
    if (resultRating === 0) {
      toast.error('Please rate the stage result (1-5 stars)');
      return;
    }

    // Validate weight after if entered
    if (weightAfterValidationError) {
      toast.error('Weight exceeds 150% of barrel capacity. Please correct before saving.');
      return;
    }

    // Calculate the actual end date from start date + duration
    const days = parseInt(completeStageDurationDays) || 0;
    const hours = parseInt(completeStageDurationHours) || 0;
    const startDate = new Date(completeStageStartDateTime);
    const actualEndDate = new Date(startDate.getTime() + (days * 24 + hours) * 60 * 60 * 1000);

    const data: CompleteStageRunRequest = {
      resultRating,
      nextAction,
      issueScratches: issueScratches || undefined,
      issueChips: issueChips || undefined,
      issueUnderRounded: issueUnderRounded || undefined,
      issueContamination: issueContamination || undefined,
      lessonsLearned: lessonsLearned || undefined,
      loadWeightAfterGrams: loadWeightAfterGrams || undefined,
      // Send the calculated actual end date
      actualEndDateTime: actualEndDate.toISOString(),
    };

    // Include advanced quality if shown
    if (showAdvancedQuality) {
      data.resultShapeRounding = resultShapeRounding;
      data.resultScratchLevel = resultScratchLevel;
      data.resultPitting = resultPitting;
      data.resultShine = resultShine;
    }

    completeStageMutation.mutate({ id: completeStageId, data });
  };

  const openEditCycleModal = () => {
    if (!cycle) return;
    setEditCycleName(cycle.name);
    setEditCycleStartDate(cycle.startDate.split('T')[0]);
    setEditCycleGoal(cycle.goal || '');
    setEditCycleNotes(cycle.notes || '');
    setIsEditCycleOpen(true);
  };

  const handleEditCycle = () => {
    if (!editCycleName.trim()) {
      toast.error('Please enter a cycle name');
      return;
    }
    updateCycleMutation.mutate({
      name: editCycleName,
      startDate: editCycleStartDate, // Already in YYYY-MM-DD format from date input
      goal: editCycleGoal || undefined,
      notes: editCycleNotes || undefined,
    });
  };

  const openEditStageModal = (stage: StageRunSummaryDto) => {
    const startDate = new Date(stage.startDateTime);
    const endDate = new Date(stage.endDateTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    const totalHours = Math.round(durationMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    setEditStageId(stage.id);
    setEditStageName(stage.stageName);
    // Set custom stage name if it's not a standard stage name
    const standardNames = STAGE_NAMES.slice(0, -1); // Exclude 'Custom' from standard names
    setEditCustomStageName(!standardNames.includes(stage.stageName) ? stage.stageName : '');
    setEditStageStartDateTime(stage.startDateTime.slice(0, 16)); // Format for datetime-local input
    setEditStageDurationDays(String(days));
    setEditStageDurationHours(String(hours));
    setEditStageNotes('');
    setIsEditStageOpen(true);
  };

  const handleEditStage = () => {
    if (!editStageId) return;
    const durationDays = parseInt(editStageDurationDays) || 0;
    const durationHours = parseInt(editStageDurationHours) || 0;

    if (durationDays === 0 && durationHours === 0) {
      toast.error('Duration must be at least 1 hour');
      return;
    }

    // Validate stage name (don't allow "Custom" as the actual name)
    if (editStageName === 'Custom' || !editStageName.trim()) {
      toast.error('Please enter a stage name');
      return;
    }

    // Validate stage start date is not before cycle start date
    if (cycle && editStageStartDateTime) {
      const cycleStartDate = new Date(cycle.startDate);
      const stageStart = new Date(editStageStartDateTime);
      cycleStartDate.setHours(0, 0, 0, 0);
      const stageStartDateOnly = new Date(stageStart);
      stageStartDateOnly.setHours(0, 0, 0, 0);
      if (stageStartDateOnly < cycleStartDate) {
        toast.error('Stage start date cannot be before the cycle start date');
        return;
      }
    }

    updateStageMutation.mutate({
      id: editStageId,
      data: {
        stageName: editStageName,
        startDateTime: new Date(editStageStartDateTime).toISOString(),
        durationDays,
        durationHours,
        notes: editStageNotes || undefined,
      },
    });
  };

  const openCleaningRunModal = (stage: StageRunSummaryDto) => {
    setCleaningRunStageId(stage.id);
    setCleaningRunStageName(formatStageDisplayName(stage.stageName, stage.runNumber, stage.totalRuns));
    setIsCleaningRunOpen(true);
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

  // Cleaning material helpers
  const addCleaningMaterial = () => {
    setCleaningMaterials([...cleaningMaterials, { materialId: '', displayAmount: '', displayUnit: 'tbsp' }]);
  };

  const removeCleaningMaterial = (index: number) => {
    setCleaningMaterials(cleaningMaterials.filter((_, i) => i !== index));
  };

  const updateCleaningMaterial = (index: number, field: 'materialId' | 'displayAmount' | 'displayUnit', value: string) => {
    const updated = [...cleaningMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setCleaningMaterials(updated);
  };

  // Cleaning duration presets (in minutes)
  const CLEANING_DURATION_PRESETS = [
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '1 day', minutes: 1440 },
  ];

  const handleCleaningDurationPreset = (minutes: number) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    setCleaningDurationDays(String(days));
    setCleaningDurationHours(String(hours));
    setCleaningDurationMinutes(String(mins));
    // Auto-populate purpose if empty
    if (!cleaningPurpose) {
      setCleaningPurpose('PostStageClean');
    }
  };

  // Auto-populate purpose when duration changes
  const handleCleaningDurationChange = (setter: (val: string) => void) => (value: string) => {
    setter(value);
    // If any duration is set and purpose is empty, default to PostStageClean
    const newDays = setter === setCleaningDurationDays ? parseInt(value) || 0 : parseInt(cleaningDurationDays) || 0;
    const newHours = setter === setCleaningDurationHours ? parseInt(value) || 0 : parseInt(cleaningDurationHours) || 0;
    const newMins = setter === setCleaningDurationMinutes ? parseInt(value) || 0 : parseInt(cleaningDurationMinutes) || 0;
    const totalMinutes = newDays * 1440 + newHours * 60 + newMins;
    if (totalMinutes > 0 && !cleaningPurpose) {
      setCleaningPurpose('PostStageClean');
    }
  };

  const toggleBarrel = (barrelId: string) => {
    setSelectedBarrelIds(prev =>
      prev.includes(barrelId)
        ? prev.filter(id => id !== barrelId)
        : [...prev, barrelId]
    );
  };

  // Get all active barrels from all active tumblers
  const allBarrels: (BarrelDto & { tumblerName: string; tumblerId: string })[] = tumblers?.flatMap(t =>
    t.isActive && t.barrels
      ? t.barrels.filter(b => b.isActive).map(b => ({
          ...b,
          tumblerName: `${t.brand} ${t.model || ''}`.trim(),
          tumblerId: t.id,
        }))
      : []
  ) || [];

  // Calculate total barrel capacity from selected barrels (for weight validation)
  const selectedBarrelCapacityLbs = selectedBarrelIds.reduce((total, id) => {
    const barrel = allBarrels.find(b => b.id === id);
    return total + (barrel?.capacityLbs || 0);
  }, 0);

  if (cycleLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Cycle not found</h2>
        <Button asChild className="mt-4">
          <Link href="/cycles">Back to Cycles</Link>
        </Button>
      </div>
    );
  }

  const activeStages = cycle.stageRuns.filter(s => s.status === 'Active');
  const completedStages = cycle.stageRuns.filter(s => s.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cycles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{cycle.name}</h1>
            <p className="text-muted-foreground">
              Started {new Date(cycle.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cycle.status === 'Active' && (
            <Button variant="outline" size="sm" onClick={openEditCycleModal}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {cycle.status === 'Completed' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/cycles/${cycleId}/share`}>
                <Share2 className="mr-2 h-4 w-4" />
                Share to Gallery
              </Link>
            </Button>
          )}
          <Badge variant={cycle.status === 'Active' ? 'default' : 'secondary'}>
            {cycle.status}
          </Badge>
        </div>
      </div>

      {/* Cycle Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="font-medium">{cycle.goal || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Difficulty</p>
            <p className="font-medium">
              {cycle.specimens && cycle.specimens.length > 0
                ? (() => {
                    const difficulties = cycle.specimens
                      .map(s => s.tumblingDifficulty)
                      .filter(Boolean);
                    if (difficulties.length === 0) return 'Not rated';
                    // Show the hardest difficulty (Hard > Medium > Easy)
                    if (difficulties.includes('Hard')) return 'Hard';
                    if (difficulties.includes('Medium')) return 'Medium';
                    return 'Easy';
                  })()
                : cycle.difficultyRating
                  ? `${cycle.difficultyRating}/5`
                  : 'Not rated'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Specimens</p>
            <p className="font-medium">
              {cycle.specimens && cycle.specimens.length > 0
                ? cycle.specimens.map(s => s.commonName).join(', ')
                : cycle.additionalSpecimens || 'Not specified'}
            </p>
          </div>
          {cycle.notes && (
            <div className="md:col-span-3">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{cycle.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Runs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Stage Runs</h2>
          {cycle.status === 'Active' && (
            <Dialog open={isAddStageOpen} onOpenChange={setIsAddStageOpen}>
              <Button onClick={openAddStageModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stage
              </Button>
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle>Add New Stage</DialogTitle>
                      <DialogDescription>
                        Start a new tumbling stage for this cycle
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
                    {/* Custom stage name input - show when Custom is selected or when stage name is not in standard list */}
                    {(stageName === 'Custom' || !STAGE_NAMES.slice(0, -1).includes(stageName)) && (
                      <Input
                        placeholder="Enter custom stage name..."
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
                    {/* Copy from Previous button - only show when there are previous stages */}
                    {cycle && cycle.stageRuns.length > 0 && (
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

                  {/* Barrel Selection - moved up */}
                  <div className="space-y-2">
                    <Label>Select Barrel(s)</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {allBarrels.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No active barrels available
                        </p>
                      ) : (
                        [...allBarrels].sort((a, b) => a.barrelNumber - b.barrelNumber).map(barrel => (
                          <div key={barrel.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`barrel-top-${barrel.id}`}
                              checked={selectedBarrelIds.includes(barrel.id)}
                              onCheckedChange={() => toggleBarrel(barrel.id)}
                            />
                            <label
                              htmlFor={`barrel-top-${barrel.id}`}
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
                    <p className="text-xs text-muted-foreground">
                      {cycle.stageRuns.length === 0
                        ? 'First stage defaults to cycle start date'
                        : 'Defaults to current date/time'}
                    </p>
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
                      <CollapsibleContent className="mt-3">
                        <DurationPicker
                          durationDays={durationDays}
                          durationHours={durationHours}
                          onDaysChange={setDurationDays}
                          onHoursChange={setDurationHours}
                          startDateTime={stageStartDateTime}
                          hideLabel
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Materials Section */}
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
                        No materials added yet. Click &quot;Add&quot; to add grit, polish, or media.
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
                                {materials?.map(m => (
                                  <SelectItem key={m.id} value={m.id}>
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

                  {/* Reminder Settings */}
                  <div className="space-y-2">
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

                  {/* Cleaning Run Section */}
                  <Collapsible open={addCleaningRun} onOpenChange={setAddCleaningRun}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Add Cleaning Run</span>
                        </div>
                        {addCleaningRun ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4 border rounded-lg p-4">
                      {/* Cleaning Duration */}
                      <div className="space-y-2">
                        <Label>Cleaning Duration</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Days</Label>
                            <Input
                              type="number"
                              min="0"
                              value={cleaningDurationDays}
                              onChange={(e) => handleCleaningDurationChange(setCleaningDurationDays)(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Hours</Label>
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              value={cleaningDurationHours}
                              onChange={(e) => handleCleaningDurationChange(setCleaningDurationHours)(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Minutes</Label>
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={cleaningDurationMinutes}
                              onChange={(e) => handleCleaningDurationChange(setCleaningDurationMinutes)(e.target.value)}
                            />
                          </div>
                        </div>
                        {/* Duration Presets */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {CLEANING_DURATION_PRESETS.map((preset) => {
                            const currentMinutes = (parseInt(cleaningDurationDays) || 0) * 1440 + (parseInt(cleaningDurationHours) || 0) * 60 + (parseInt(cleaningDurationMinutes) || 0);
                            return (
                              <Button
                                key={preset.minutes}
                                type="button"
                                variant={currentMinutes === preset.minutes ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleCleaningDurationPreset(preset.minutes)}
                              >
                                {preset.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cleaning Purpose */}
                      <div className="space-y-2">
                        <Label>Purpose (optional)</Label>
                        <Select value={cleaningPurpose} onValueChange={setCleaningPurpose}>
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

                      {/* Cleaning Materials */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Cleaning Materials</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={addCleaningMaterial}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        {cleaningMaterials.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            No materials added. Click &quot;Add&quot; to add soap, media, etc.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {cleaningMaterials.map((mat, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Select
                                  value={mat.materialId}
                                  onValueChange={(value) => updateCleaningMaterial(index, 'materialId', value)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select material..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materials?.filter(m => m.category !== 'Abrasive').map((m) => (
                                      <SelectItem key={m.id} value={m.id}>
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
                                  onChange={(e) => updateCleaningMaterial(index, 'displayAmount', e.target.value)}
                                />
                                <Select
                                  value={mat.displayUnit}
                                  onValueChange={(value) => updateCleaningMaterial(index, 'displayUnit', value)}
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
                                  onClick={() => removeCleaningMaterial(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Cleaning Notes */}
                      <div className="space-y-2">
                        <Label>Cleaning Notes (optional)</Label>
                        <Textarea
                          placeholder="e.g., Extra rinse to remove all grit residue..."
                          value={cleaningNotes}
                          onChange={(e) => setCleaningNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Advanced Options - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span>Advanced Options</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4">
                      {/* Load Weight */}
                      <WeightInput
                        label="Load Weight Before"
                        valueGrams={loadWeightBeforeGrams}
                        onValueChange={setLoadWeightBeforeGrams}
                        barrelCapacityLbs={selectedBarrelCapacityLbs > 0 ? selectedBarrelCapacityLbs : undefined}
                        onValidationChange={(isValid) => setWeightBeforeValidationError(!isValid)}
                      />

                      {/* Fill Level */}
                      <div className="space-y-2">
                        <Label>Barrel Fill Level (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g., 75"
                          value={fillLevelPercent}
                          onChange={(e) => setFillLevelPercent(e.target.value)}
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
                    </CollapsibleContent>
                  </Collapsible>

                  </div>
                </div>
                <DialogFooter className="flex-shrink-0">
                  <Button variant="outline" onClick={() => setIsAddStageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStage} disabled={addStageMutation.isPending}>
                    {addStageMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Start Stage
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {cycle.stageRuns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No stages yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first stage to start tracking this cycle
              </p>
              {cycle.status === 'Active' && (
                <Button onClick={openAddStageModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Stage
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Active Stages */}
            {activeStages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
                {activeStages.map((stage: StageRunSummaryDto) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    onComplete={() => openCompleteStageModal(stage)}
                    onEdit={() => openEditStageModal(stage)}
                    onDelete={() => deleteStageRunMutation.mutate(stage.id)}
                    onAddCleaningRun={() => openCleaningRunModal(stage)}
                    isCompleting={completeStageMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Completed Stages */}
            {completedStages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                {completedStages.map((stage: StageRunSummaryDto) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    onDelete={() => deleteStageRunMutation.mutate(stage.id)}
                    onAddCleaningRun={() => openCleaningRunModal(stage)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complete Stage Modal */}
      <Dialog open={isCompleteStageOpen} onOpenChange={setIsCompleteStageOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>Complete Stage</DialogTitle>
                <DialogDescription>
                  Mark &quot;{formatStageDisplayName(completeStageName, completeStageRunNumber, completeStageTotalRuns)}&quot; as complete
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

          <div className="space-y-4 py-4">
            {/* Duration - Collapsible (collapsed by default) */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Actual Duration</span>
                    {(parseInt(completeStageDurationDays) > 0 || parseInt(completeStageDurationHours) > 0) && (
                      <span className="text-muted-foreground text-sm">
                        ({completeStageDurationDays}d {completeStageDurationHours}h)
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <DurationPicker
                  durationDays={completeStageDurationDays}
                  durationHours={completeStageDurationHours}
                  onDaysChange={setCompleteStageDurationDays}
                  onHoursChange={setCompleteStageDurationHours}
                  startDateTime={completeStageStartDateTime}
                  hideLabel
                  helperText="Adjust if the stage finished earlier or later than originally planned."
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Result Rating */}
            <div className="space-y-2">
              <Label>How did this stage turn out? *</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setResultRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= resultRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
                <span className="ml-2 self-center text-sm text-muted-foreground">
                  {resultRating > 0 ? `${resultRating}/5` : 'Click to rate'}
                </span>
              </div>
            </div>

            {/* Advanced Quality Ratings - Collapsible */}
            <Collapsible open={showAdvancedQuality} onOpenChange={setShowAdvancedQuality}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  {showAdvancedQuality ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  {showAdvancedQuality ? 'Hide' : 'Show'} advanced quality ratings
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Shape/Rounding</Label>
                      <span className="text-sm text-muted-foreground">{resultShapeRounding}%</span>
                    </div>
                    <Slider
                      value={[resultShapeRounding]}
                      onValueChange={([v]) => setResultShapeRounding(v)}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Scratch Level</Label>
                      <span className="text-sm text-muted-foreground">{resultScratchLevel}%</span>
                    </div>
                    <Slider
                      value={[resultScratchLevel]}
                      onValueChange={([v]) => setResultScratchLevel(v)}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Pitting/Chips</Label>
                      <span className="text-sm text-muted-foreground">{resultPitting}%</span>
                    </div>
                    <Slider
                      value={[resultPitting]}
                      onValueChange={([v]) => setResultPitting(v)}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Shine</Label>
                      <span className="text-sm text-muted-foreground">{resultShine}%</span>
                    </div>
                    <Slider
                      value={[resultShine]}
                      onValueChange={([v]) => setResultShine(v)}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Issues */}
            <div className="space-y-2">
              <Label>Any issues? (check all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="issueScratches" checked={issueScratches} onCheckedChange={(c) => setIssueScratches(c as boolean)} />
                  <Label htmlFor="issueScratches" className="text-sm">Scratches</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="issueChips" checked={issueChips} onCheckedChange={(c) => setIssueChips(c as boolean)} />
                  <Label htmlFor="issueChips" className="text-sm">Chips/Bruises</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="issueUnderRounded" checked={issueUnderRounded} onCheckedChange={(c) => setIssueUnderRounded(c as boolean)} />
                  <Label htmlFor="issueUnderRounded" className="text-sm">Under-rounded</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="issueContamination" checked={issueContamination} onCheckedChange={(c) => setIssueContamination(c as boolean)} />
                  <Label htmlFor="issueContamination" className="text-sm">Grit contamination</Label>
                </div>
              </div>
            </div>

            {/* Weight After */}
            <WeightInput
              label={
                completeStageWeightBefore
                  ? `Weight After (Before: ${settings?.measurementSystem === 'Metric'
                      ? `${(completeStageWeightBefore / 1000).toFixed(2)} kg`
                      : `${(completeStageWeightBefore / 453.592).toFixed(1)} lbs`})`
                  : "Weight After (optional)"
              }
              valueGrams={loadWeightAfterGrams}
              onValueChange={setLoadWeightAfterGrams}
              barrelCapacityLbs={completeStageBarrelCapacity || undefined}
              onValidationChange={(isValid) => setWeightAfterValidationError(!isValid)}
            />

            {/* Lessons Learned */}
            <div className="space-y-2">
              <Label>Lessons learned (optional)</Label>
              <Textarea
                placeholder="What would you do differently next time?"
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                rows={2}
              />
            </div>

            {/* What's Next */}
            <div className="space-y-2">
              <Label>What&apos;s next?</Label>
              <RadioGroup value={nextAction} onValueChange={setNextAction}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Advance" id="advance" />
                  <Label htmlFor="advance">Advance to next stage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Repeat" id="repeat" />
                  <Label htmlFor="repeat">Repeat this stage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Abort" id="abort" />
                  <Label htmlFor="abort">Stop here (abort / re-cut stones)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Cleaning Run Display */}
            {completeStageCleaningRun && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Cleaning Run</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{formatDurationMinutes(completeStageCleaningRun.durationMinutes)}</span>
                  </div>
                  {completeStageCleaningRun.purpose && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span>{formatCleaningPurpose(completeStageCleaningRun.purpose)}</span>
                    </div>
                  )}
                  {completeStageCleaningRun.materials && completeStageCleaningRun.materials.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Materials:</span>
                      <ul className="mt-1 ml-4 list-disc text-xs">
                        {completeStageCleaningRun.materials.map((mat, idx) => (
                          <li key={idx}>
                            {mat.materialName}
                            {mat.displayAmount && ` - ${mat.displayAmount} ${mat.displayUnit || ''}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {completeStageCleaningRun.notes && (
                    <div>
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-1 text-xs">{completeStageCleaningRun.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteStageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteStage} disabled={completeStageMutation.isPending}>
              {completeStageMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Complete Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cycle Modal */}
      <Dialog open={isEditCycleOpen} onOpenChange={setIsEditCycleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cycle</DialogTitle>
            <DialogDescription>
              Update cycle details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cycle Name *</Label>
              <Input
                value={editCycleName}
                onChange={(e) => setEditCycleName(e.target.value)}
                placeholder="e.g., Beach Agates Batch 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editCycleStartDate}
                onChange={(e) => setEditCycleStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Goal (optional)</Label>
              <Input
                value={editCycleGoal}
                onChange={(e) => setEditCycleGoal(e.target.value)}
                placeholder="e.g., Polished cabochons"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={editCycleNotes}
                onChange={(e) => setEditCycleNotes(e.target.value)}
                placeholder="Any notes about this cycle..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCycleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCycle} disabled={updateCycleMutation.isPending}>
              {updateCycleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Modal */}
      <Dialog open={isEditStageOpen} onOpenChange={setIsEditStageOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>Edit Stage</DialogTitle>
                <DialogDescription>
                  Adjust the stage duration. Use this if the stage finished earlier or later than planned.
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <div className="flex flex-wrap gap-1">
                {STAGE_NAMES.map(name => (
                  <Button
                    key={name}
                    type="button"
                    variant={editStageName === name || (name === 'Custom' && !STAGE_NAMES.slice(0, -1).includes(editStageName)) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (name === 'Custom') {
                        setEditStageName('Custom');
                        setEditCustomStageName('');
                      } else {
                        setEditStageName(name);
                        setEditCustomStageName('');
                      }
                    }}
                  >
                    {name}
                  </Button>
                ))}
              </div>
              {/* Custom stage name input - show when Custom is selected or when stage name is not in standard list */}
              {(editStageName === 'Custom' || !STAGE_NAMES.slice(0, -1).includes(editStageName)) && (
                <Input
                  placeholder="Enter custom stage name..."
                  value={editStageName === 'Custom' ? editCustomStageName : editStageName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditCustomStageName(value);
                    if (value) {
                      setEditStageName(value);
                    } else {
                      setEditStageName('Custom');
                    }
                  }}
                  className="mt-2"
                />
              )}
            </div>
            <DurationPicker
              durationDays={editStageDurationDays}
              durationHours={editStageDurationHours}
              onDaysChange={setEditStageDurationDays}
              onHoursChange={setEditStageDurationHours}
              startDateTime={editStageStartDateTime}
              helperText="Tip: If the stage finished early (e.g., 3 days instead of 7), reduce the duration here before marking complete."
            />
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={editStageNotes}
                onChange={(e) => setEditStageNotes(e.target.value)}
                placeholder="Any notes about this change..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStage} disabled={updateStageMutation.isPending}>
              {updateStageMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleaning Run Modal */}
      {cleaningRunStageId && (
        <CleaningRunModal
          open={isCleaningRunOpen}
          onOpenChange={setIsCleaningRunOpen}
          stageId={cleaningRunStageId}
          stageName={cleaningRunStageName}
          cycleId={cycleId}
        />
      )}

      {/* Photos */}
      <CyclePhotos cycleId={cycleId} stages={cycle?.stageRuns || []} />
    </div>
  );
}

// Helper to format stage display name with run number
// Shows "Run X" only when there are multiple runs of the same stage type
function formatStageDisplayName(stageName: string, runNumber: number, totalRuns: number): string {
  if (totalRuns <= 1) {
    return stageName;
  }
  return `${stageName} Run ${runNumber}`;
}

function StageCard({
  stage,
  onComplete,
  onEdit,
  onDelete,
  onAddCleaningRun,
  isCompleting,
}: {
  stage: StageRunSummaryDto;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onAddCleaningRun?: () => void;
  isCompleting?: boolean;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isActive = stage.status === 'Active';
  const startDate = new Date(stage.startDateTime);
  const endDate = new Date(stage.endDateTime);
  const now = new Date();
  const isOverdue = isActive && endDate < now;
  const displayName = formatStageDisplayName(stage.stageName, stage.runNumber, stage.totalRuns);

  // Calculate progress
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progressPercent = isActive ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 100;

  const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
  const currentDay = Math.ceil(elapsed / (1000 * 60 * 60 * 24));

  const timeRemaining = isActive ? getTimeRemaining(endDate) : null;

  const handleCardClick = () => {
    if (isActive && onEdit) {
      onEdit();
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <Card
      className={`${isOverdue ? 'border-yellow-300' : ''} ${isActive && onEdit ? 'cursor-pointer transition-colors hover:bg-muted/50' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${isActive ? 'bg-blue-100' : 'bg-green-100'}`}>
              {isActive ? (
                <Play className="h-4 w-4 text-blue-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                Started {startDate.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {stage.resultRating && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {stage.resultRating}/5
              </Badge>
            )}
            {isActive && onAddCleaningRun && (
              <Button variant="secondary" size="sm" onClick={onAddCleaningRun}>
                <Sparkles className="mr-2 h-4 w-4" />
                Cleaning Run
              </Button>
            )}
            {isActive && onComplete && (
              <Button size="sm" onClick={onComplete} disabled={isCompleting}>
                {isCompleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Complete'
                )}
              </Button>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isActive && onEdit && (
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Duration
                  </DropdownMenuItem>
                )}
                {onAddCleaningRun && (
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAddCleaningRun(); }}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Add Cleaning Run
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Stage?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{displayName}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Progress */}
        {isActive && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isOverdue ? (
                  <span className="text-yellow-600 font-medium">Overdue</span>
                ) : (
                  `Day ${Math.min(currentDay, totalDays)} of ${totalDays}`
                )}
              </span>
              <span className="text-muted-foreground">
                {isOverdue ? 'Ready to complete' : `${timeRemaining} remaining`}
              </span>
            </div>
            <Progress value={progressPercent} className={isOverdue ? '[&>div]:bg-yellow-500' : ''} />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(progressPercent)}% complete
            </p>
          </div>
        )}

        {!isActive && (
          <p className="text-sm text-muted-foreground">
            Completed {endDate.toLocaleDateString()}
          </p>
        )}

        {/* Cleaning Run Section */}
        {stage.cleaningRun && (
          <Collapsible className="mt-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between p-2 h-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Cleaning Run</span>
                  <Badge variant={stage.cleaningRun.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                    {stage.cleaningRun.status}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent onClick={(e) => e.stopPropagation()}>
              <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{formatDurationMinutes(stage.cleaningRun.durationMinutes)}</span>
                </div>
                {stage.cleaningRun.purpose && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose:</span>
                    <span>{formatCleaningPurpose(stage.cleaningRun.purpose)}</span>
                  </div>
                )}
                {stage.cleaningRun.materials && stage.cleaningRun.materials.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Materials:</span>
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      {stage.cleaningRun.materials.map((mat, idx) => (
                        <li key={idx}>
                          {mat.materialName}
                          {mat.displayAmount && ` - ${mat.displayAmount} ${mat.displayUnit || ''}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {stage.cleaningRun.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-xs">{stage.cleaningRun.notes}</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

function formatDurationMinutes(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

  return parts.join(' ');
}

function formatCleaningPurpose(purpose: string): string {
  const purposeMap: Record<string, string> = {
    'PostStageClean': 'Post-Stage Clean',
    'PrePolishClean': 'Pre-Polish Clean',
    'FinalBurnish': 'Final Burnish',
    'GritRemoval': 'Grit Removal',
  };
  return purposeMap[purpose] || purpose;
}

function getTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) return 'Overdue';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}
