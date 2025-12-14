'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi, tumblerApi } from '@/lib/api';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Eye,
  Image as ImageIcon,
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
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import { CyclePhotos } from '@/components/cycle-photos';
import { PhotoUploadModal } from '@/components/photo-upload-modal';
import { DurationPicker } from '@/components/duration-picker';
import { WeightInput } from '@/components/weight-input';
import { CleaningRunModal } from '@/components/cleaning-run-modal';
import { useSettings } from '@/hooks/use-user';
import { useMaterials } from '@/hooks/use-materials';
import { formatDateTimeLocal, combineDateWithCurrentTime, isStageStartBeforeCycleStart, calculateDurationFromDates } from '@/lib/date-utils';
import { convertMinutesToDaysHoursMinutes, formatDurationMinutes } from '@/lib/duration-utils';
import { CLEANING_PURPOSES, CLEANING_DURATION_PRESETS, formatCleaningPurpose } from '@/lib/cleaning-constants';
import { formatStageDisplayName, getStageProgressText } from '@/lib/cycle-utils';
import type { StageRunSummaryDto, StageRunDto, CreateStageMaterialRequest, CreateCleaningMaterialRequest, CompleteStageRunRequest, UpdateCycleRequest, UpdateStageRunRequest, CleaningRunDto, CompleteCycleRequest } from '@/types/cycle';
import type { BarrelDto } from '@/types/tumbler';
import { PageTransition } from '@/components/ui/page-transition';

const STAGE_NAMES = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish', 'Custom'];
const WATER_UNITS = [
  { value: 'ml', label: 'ml' },
  { value: 'floz', label: 'fl oz' },
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
  // Edit Stage Quality fields (like Complete Stage)
  const [editStageResultRating, setEditStageResultRating] = useState<number>(0);
  const [editStageShowAdvancedQuality, setEditStageShowAdvancedQuality] = useState(false);
  const [editStageShapeRounding, setEditStageShapeRounding] = useState<number>(50);
  const [editStageScratchLevel, setEditStageScratchLevel] = useState<number>(50);
  const [editStagePitting, setEditStagePitting] = useState<number>(50);
  const [editStageShine, setEditStageShine] = useState<number>(50);
  const [editStageIssueScratches, setEditStageIssueScratches] = useState(false);
  const [editStageIssueChips, setEditStageIssueChips] = useState(false);
  const [editStageIssueUnderRounded, setEditStageIssueUnderRounded] = useState(false);
  const [editStageIssueContamination, setEditStageIssueContamination] = useState(false);
  const [editStageLessonsLearned, setEditStageLessonsLearned] = useState('');
  const [editStageNextAction, setEditStageNextAction] = useState<string>('');
  const [editStageWeightAfterGrams, setEditStageWeightAfterGrams] = useState<number | null>(null);
  const [editStageWeightAfterValidationError, setEditStageWeightAfterValidationError] = useState(false);
  const [editStageBarrelCapacity, setEditStageBarrelCapacity] = useState<number | null>(null);
  const [editStageWeightBefore, setEditStageWeightBefore] = useState<number | null>(null);
  const [editStageRunNumber, setEditStageRunNumber] = useState<number>(1);
  const [editStageTotalRuns, setEditStageTotalRuns] = useState<number>(1);
  const [editStageIsLoading, setEditStageIsLoading] = useState(false);

  // Cleaning Run Modal State
  const [isCleaningRunOpen, setIsCleaningRunOpen] = useState(false);
  const [cleaningRunStageId, setCleaningRunStageId] = useState<string | null>(null);
  const [cleaningRunStageName, setCleaningRunStageName] = useState('');

  // Complete Cycle Dialog State
  const [isCompleteCycleOpen, setIsCompleteCycleOpen] = useState(false);
  const [completeCycleFinalQuality, setCompleteCycleFinalQuality] = useState<number>(0);
  const [completeCycleNotes, setCompleteCycleNotes] = useState('');

  // View Stage Modal State
  const [isViewStageOpen, setIsViewStageOpen] = useState(false);
  const [viewStageId, setViewStageId] = useState<string | null>(null);

  // Cycle Overview Collapsible State
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);

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

  // Query for viewing stage details
  const { data: viewStageData, isLoading: viewStageLoading } = useQuery({
    queryKey: ['stage', viewStageId],
    queryFn: () => cycleApi.getStageRun(viewStageId!),
    enabled: !!viewStageId && isViewStageOpen,
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- openAddStageModal uses refs internally
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
    onSuccess: async (_result, variables) => {
      const shouldAutoRepeat = variables.data.nextAction === 'Repeat';
      const shouldAutoAdvance = variables.data.nextAction === 'Advance';

      // Check if there are any planned stages
      const hasPlannedStages = cycle?.stageRuns.some(s => s.status === 'Planned') ?? false;

      // Auto-create stage if Repeat or Advance selected and no planned stages
      if ((shouldAutoRepeat || shouldAutoAdvance) && cycle && !hasPlannedStages) {
        try {
          // Fetch the full stage details to copy from
          const completedStage = await cycleApi.getStageRun(variables.id);

          // Get active barrel IDs (filter out any that may have been deleted)
          const activeBarrelIds = completedStage.barrels
            ?.map(b => b.barrelId)
            .filter(id => allBarrels.some(b => b.barrelId === id)) || [];

          // Calculate start date from completed stage's end date
          const endDateString = completedStage.endDateTime ?? completedStage.durationEstimateEndDate;
          const startDateTime = endDateString
            ? new Date(endDateString).toISOString()
            : new Date().toISOString();

          // Determine stage name based on action
          let newStageName = completedStage.stageName;
          if (shouldAutoAdvance) {
            // Get next stage in progression: Coarse → Medium → Fine → Pre-Polish → Polish → Burnish
            const stageProgression = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish'];
            const currentIndex = stageProgression.indexOf(completedStage.stageName);
            if (currentIndex >= 0 && currentIndex < stageProgression.length - 1) {
              newStageName = stageProgression[currentIndex + 1];
            } else if (currentIndex === -1) {
              // Custom stage name - default to next logical stage or keep same
              newStageName = 'Medium'; // Default fallback
            }
            // If already at Burnish, don't auto-create (cycle should be completed)
            if (currentIndex === stageProgression.length - 1) {
              toast.success('Stage completed. Cycle appears to be at final stage.');
              queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
              queryClient.invalidateQueries({ queryKey: ['cycles'] });
              setIsCompleteStageOpen(false);
              resetCompleteStageForm();
              return;
            }
          }

          // For Repeat: copy materials. For Advance: don't copy (different grit needed)
          const materials = shouldAutoRepeat
            ? completedStage.materials?.map(m => ({
                materialId: m.materialId,
                displayAmount: m.displayAmount ?? undefined,
                displayUnit: m.displayUnit || 'tbsp',
              }))
            : undefined;

          // Copy cleaning run if present (useful for both repeat and advance)
          const cleaningRun = completedStage.cleaningRun ? {
            durationMinutes: completedStage.cleaningRun.durationMinutes,
            purpose: completedStage.cleaningRun.purpose ?? undefined,
            notes: completedStage.cleaningRun.notes ?? undefined,
            materials: completedStage.cleaningRun.materials?.map(m => ({
              materialId: m.materialId,
              displayAmount: m.displayAmount ?? undefined,
              displayUnit: m.displayUnit || 'tbsp',
            })),
          } : undefined;

          // Create the new stage run
          await cycleApi.addStageRun(cycleId, {
            barrelIds: activeBarrelIds,
            stageName: newStageName,
            startDateTime,
            durationDays: completedStage.durationDays,
            durationHours: completedStage.durationHours,
            notes: shouldAutoRepeat ? (completedStage.notes ?? undefined) : undefined,
            reminderEnabled: false,
            materials,
            cleaningRun,
          });

          const actionWord = shouldAutoRepeat ? 'repeat' : 'advance';
          toast.success(`Stage completed and "${newStageName}" stage auto-created for ${actionWord}`);
        } catch {
          // If auto-create fails, still show completion success
          toast.success('Stage completed');
          toast.error('Failed to auto-create next stage. Please add it manually.');
        }
      } else {
        toast.success('Stage completed');
      }

      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
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

  const completeCycleMutation = useMutation({
    mutationFn: (data: CompleteCycleRequest) => cycleApi.complete(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Cycle completed! You can now share it to the gallery.');
      setIsCompleteCycleOpen(false);
      setCompleteCycleFinalQuality(0);
      setCompleteCycleNotes('');
    },
    onError: () => {
      toast.error('Failed to complete cycle');
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
    if (cycle && isStageStartBeforeCycleStart(cycle.startDate, stageStartDateTime)) {
      toast.error('Stage start date cannot be before the cycle start date');
      return;
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
          const fullStage: StageRunDto = await cycleApi.getStageRun(lastCompletedStage.stageRunId);
          if (fullStage.nextAction === 'Repeat') {
            // Auto-populate from the repeated stage (excluding advanced options)
            setStageName(fullStage.stageName);

            // Set start date to previous stage's end date (use estimate as fallback)
            const endDateString = fullStage.endDateTime ?? fullStage.durationEstimateEndDate;
            if (endDateString) {
              const previousEndDate = new Date(endDateString);
              setStageStartDateTime(formatDateTimeLocal(previousEndDate));
            }

            // Copy barrels
            if (fullStage.barrels && fullStage.barrels.length > 0) {
              const previousBarrelIds = fullStage.barrels.map(b => b.barrelId);
              // Only select barrels that are still active
              const activeBarrelIds = previousBarrelIds.filter(id =>
                allBarrels.some(b => b.barrelId === id)
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
              const { days, hours, mins } = convertMinutesToDaysHoursMinutes(fullStage.cleaningRun.durationMinutes);
              setCleaningDurationDays(String(days));
              setCleaningDurationHours(String(hours));
              setCleaningDurationMinutes(String(mins));
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
      const previousStage: StageRunDto = await cycleApi.getStageRun(previousStageSummary.stageRunId);

      // Set start date to previous stage's end date (use estimate as fallback)
      const endDateString = previousStage.endDateTime ?? previousStage.durationEstimateEndDate;
      if (endDateString) {
        const previousEndDate = new Date(endDateString);
        setStageStartDateTime(formatDateTimeLocal(previousEndDate));
      }

      // Copy barrels
      if (previousStage.barrels && previousStage.barrels.length > 0) {
        const previousBarrelIds = previousStage.barrels.map(b => b.barrelId);
        // Only select barrels that are still active
        const activeBarrelIds = previousBarrelIds.filter(id =>
          allBarrels.some(b => b.barrelId === id)
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
        const { days, hours, mins } = convertMinutesToDaysHoursMinutes(previousStage.cleaningRun.durationMinutes);
        setCleaningDurationDays(String(days));
        setCleaningDurationHours(String(hours));
        setCleaningDurationMinutes(String(mins));
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
    // Use durationEstimateEndDate for active stages (endDateTime is null until completed)
    const endDateString = stage.endDateTime ?? stage.durationEstimateEndDate;
    const endDate = endDateString ? new Date(endDateString) : new Date();
    const { days, hours } = calculateDurationFromDates(startDate, endDate);

    setCompleteStageId(stage.stageRunId);
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
      const fullStage: StageRunDto = await cycleApi.getStageRun(stage.stageRunId);
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
      notes: editCycleNotes || undefined,
    });
  };

  const openEditStageModal = async (stage: StageRunSummaryDto) => {
    const startDate = new Date(stage.startDateTime);
    // Use durationEstimateEndDate for active/planned stages (endDateTime is null until completed)
    const endDateString = stage.endDateTime ?? stage.durationEstimateEndDate;
    const endDate = endDateString ? new Date(endDateString) : new Date();
    const { days, hours } = calculateDurationFromDates(startDate, endDate);

    setEditStageId(stage.stageRunId);
    setEditStageName(stage.stageName);
    // Set custom stage name if it's not a standard stage name
    const standardNames = STAGE_NAMES.slice(0, -1); // Exclude 'Custom' from standard names
    setEditCustomStageName(!standardNames.includes(stage.stageName) ? stage.stageName : '');
    setEditStageStartDateTime(stage.startDateTime.slice(0, 16)); // Format for datetime-local input
    setEditStageDurationDays(String(days));
    setEditStageDurationHours(String(hours));
    setEditStageRunNumber(stage.runNumber);
    setEditStageTotalRuns(stage.totalRuns);
    // Reset quality fields before loading
    setEditStageNotes('');
    setEditStageResultRating(0);
    setEditStageShowAdvancedQuality(false);
    setEditStageShapeRounding(50);
    setEditStageScratchLevel(50);
    setEditStagePitting(50);
    setEditStageShine(50);
    setEditStageIssueScratches(false);
    setEditStageIssueChips(false);
    setEditStageIssueUnderRounded(false);
    setEditStageIssueContamination(false);
    setEditStageLessonsLearned('');
    setEditStageNextAction('');
    setEditStageWeightAfterGrams(null);
    setEditStageWeightBefore(null);
    setEditStageBarrelCapacity(null);
    setEditStageIsLoading(true);
    setIsEditStageOpen(true);

    // Fetch full stage details to get quality fields, weight, and barrel capacity
    try {
      const fullStage: StageRunDto = await cycleApi.getStageRun(stage.stageRunId);
      // Populate quality fields from fetched data
      setEditStageNotes(fullStage.notes || '');
      setEditStageResultRating(fullStage.resultRating || 0);
      setEditStageShapeRounding(fullStage.resultShapeRounding ?? 50);
      setEditStageScratchLevel(fullStage.resultScratchLevel ?? 50);
      setEditStagePitting(fullStage.resultPitting ?? 50);
      setEditStageShine(fullStage.resultShine ?? 50);
      setEditStageIssueScratches(fullStage.issueScratches ?? false);
      setEditStageIssueChips(fullStage.issueChips ?? false);
      setEditStageIssueUnderRounded(fullStage.issueUnderRounded ?? false);
      setEditStageIssueContamination(fullStage.issueContamination ?? false);
      setEditStageLessonsLearned(fullStage.lessonsLearned || '');
      setEditStageNextAction(fullStage.nextAction || '');
      setEditStageWeightAfterGrams(fullStage.loadWeightAfterGrams);
      setEditStageWeightBefore(fullStage.loadWeightBeforeGrams);
      // Show advanced quality if any of the sliders have non-default values
      if (fullStage.resultShapeRounding !== null || fullStage.resultScratchLevel !== null ||
          fullStage.resultPitting !== null || fullStage.resultShine !== null) {
        setEditStageShowAdvancedQuality(true);
      }
      // Calculate total barrel capacity
      if (fullStage.barrels && fullStage.barrels.length > 0) {
        const totalCapacity = fullStage.barrels.reduce((sum, b) => sum + (b.capacityLbs || 0), 0);
        setEditStageBarrelCapacity(totalCapacity > 0 ? totalCapacity : null);
      }
    } catch {
      // Ignore error - quality fields are optional
    } finally {
      setEditStageIsLoading(false);
    }
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
      if (isStageStartBeforeCycleStart(cycle.startDate, editStageStartDateTime)) {
        toast.error('Stage start date cannot be before the cycle start date');
        return;
      }
    }

    // Validate weight after if entered
    if (editStageWeightAfterValidationError) {
      toast.error('Weight exceeds 150% of barrel capacity. Please correct before saving.');
      return;
    }

    updateStageMutation.mutate({
      id: editStageId,
      data: {
        stageName: editStageName,
        startDateTime: new Date(editStageStartDateTime).toISOString(),
        durationDays,
        durationHours,
        notes: editStageNotes || undefined,
        // Quality ratings
        resultRating: editStageResultRating > 0 ? editStageResultRating : undefined,
        resultShapeRounding: editStageShowAdvancedQuality ? editStageShapeRounding : undefined,
        resultScratchLevel: editStageShowAdvancedQuality ? editStageScratchLevel : undefined,
        resultPitting: editStageShowAdvancedQuality ? editStagePitting : undefined,
        resultShine: editStageShowAdvancedQuality ? editStageShine : undefined,
        // Issues
        issueScratches: editStageIssueScratches || undefined,
        issueChips: editStageIssueChips || undefined,
        issueUnderRounded: editStageIssueUnderRounded || undefined,
        issueContamination: editStageIssueContamination || undefined,
        // Lessons and next action
        lessonsLearned: editStageLessonsLearned || undefined,
        nextAction: editStageNextAction || undefined,
        // Weight after
        loadWeightAfterGrams: editStageWeightAfterGrams ?? undefined,
      },
    });
  };

  const openViewStageModal = (stage: StageRunSummaryDto) => {
    setViewStageId(stage.stageRunId);
    setIsViewStageOpen(true);
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

  const handleCleaningDurationPreset = (minutes: number) => {
    const { days, hours, mins } = convertMinutesToDaysHoursMinutes(minutes);
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
          tumblerId: t.tumblerId,
        }))
      : []
  ) || [];

  // Calculate total barrel capacity from selected barrels (for weight validation)
  const selectedBarrelCapacityLbs = selectedBarrelIds.reduce((total, id) => {
    const barrel = allBarrels.find(b => b.barrelId === id);
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
  const plannedStages = cycle.stageRuns.filter(s => s.status === 'Planned');
  const completedStages = cycle.stageRuns.filter(s => s.status === 'Completed');
  const incompleteStages = [...activeStages, ...plannedStages];
  const hasIncompleteStages = incompleteStages.length > 0;

  // Format runtime in a human-readable way
  const formatRuntime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) {
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    return `${hours}h`;
  };

  return (
    <PageTransition>
      <div className={PAGE_CONTAINER}>
        {/* Back button */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cycles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-muted-foreground">Back to Cycles</span>
        </div>

      {/* Collapsible Cycle Overview Card */}
      <Collapsible open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Title and metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={cycle.status === 'Active' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {cycle.status}
                    </Badge>
                    <CardTitle className="text-base sm:text-lg leading-tight truncate">{cycle.name}</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Day {cycle.elapsedDays}</span>
                    <span>•</span>
                    <span>{cycle.completedStagesCount} stage{cycle.completedStagesCount !== 1 ? 's' : ''}</span>
                    {cycle.status === 'Active' && cycle.activeStageName && (
                      <>
                        <span>•</span>
                        <span className="text-primary font-medium">{cycle.activeStageName}</span>
                      </>
                    )}
                    {cycle.status === 'Completed' && cycle.finalQuality && (
                      <>
                        <span>•</span>
                        <span>{cycle.finalQuality}/5 ★</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions and chevron */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {cycle.status === 'Active' && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEditCycleModal}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="default" size="sm" className="h-8" onClick={() => setIsCompleteCycleOpen(true)}>
                        <CheckCircle2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Complete</span>
                      </Button>
                    </>
                  )}
                  {cycle.status === 'Completed' && (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      {cycle.postId ? (
                        <Link href={`/gallery/${cycle.postId}`}>
                          <Eye className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                      ) : (
                        <Link href={`/cycles/${cycleId}/share`}>
                          <Share2 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Share</span>
                        </Link>
                      )}
                    </Button>
                  )}
                  {isOverviewOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid gap-4 md:grid-cols-3 pt-0">
              {/* Row 1: Key stats */}
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-medium">{new Date(cycle.startDate).toLocaleDateString()}</p>
              </div>
              {cycle.status === 'Completed' && cycle.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">{new Date(cycle.endDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Runtime</p>
                <p className="font-medium">{formatRuntime(cycle.totalRuntimeHours)}</p>
              </div>

              {/* Row 2: Specimens and difficulty */}
              <div>
                <p className="text-sm text-muted-foreground">Specimens</p>
                <p className="font-medium">
                  {cycle.specimens && cycle.specimens.length > 0
                    ? cycle.specimens.map(s => s.commonName).join(', ')
                    : cycle.additionalSpecimens || 'Not specified'}
                </p>
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
                        if (difficulties.includes('Hard')) return 'Hard';
                        if (difficulties.includes('Medium')) return 'Medium';
                        return 'Easy';
                      })()
                    : cycle.difficultyRating
                      ? `${cycle.difficultyRating}/5`
                      : 'Not rated'}
                </p>
              </div>

              {/* Row 3: Photos */}
              {cycle.photoCount > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Photos</p>
                  <p className="font-medium">{cycle.photoCount} photo{cycle.photoCount !== 1 ? 's' : ''}</p>
                </div>
              )}

              {/* Tumbler/Barrel info */}
              {(cycle.tumblerName || cycle.barrelName) && (
                <div>
                  <p className="text-sm text-muted-foreground">Equipment</p>
                  <p className="font-medium">
                    {[cycle.tumblerName, cycle.barrelName].filter(Boolean).join(' - ')}
                  </p>
                </div>
              )}

              {/* Gallery post info */}
              {cycle.postId && (
                <div>
                  <p className="text-sm text-muted-foreground">Gallery</p>
                  <p className="font-medium">
                    {cycle.galleryLikes} like{cycle.galleryLikes !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Last updated */}
              {cycle.lastUpdated && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{new Date(cycle.lastUpdated).toLocaleDateString()}</p>
                </div>
              )}

              {/* Notes - full width */}
              {cycle.notes && (
                <div className="md:col-span-3">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{cycle.notes}</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Stage Runs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Stage Runs</h2>
          {cycle.status === 'Active' && (
            <Dialog open={isAddStageOpen} onOpenChange={setIsAddStageOpen}>
              <Button onClick={openAddStageModal}>
                <Plus className="mr-2 h-4 w-4" />
                New Stage
              </Button>
              <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                  <div className="flex items-start justify-between pr-8">
                    <div>
                      <DialogTitle>New Stage</DialogTitle>
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
                        [...allBarrels].sort((a, b) => {
                          const tumblerCompare = (a.tumblerName || '').localeCompare(b.tumblerName || '');
                          if (tumblerCompare !== 0) return tumblerCompare;
                          return a.barrelNumber - b.barrelNumber;
                        }).map(barrel => (
                          <div key={barrel.barrelId} className="flex items-center space-x-2">
                            <Checkbox
                              id={`barrel-top-${barrel.barrelId}`}
                              checked={selectedBarrelIds.includes(barrel.barrelId)}
                              onCheckedChange={() => toggleBarrel(barrel.barrelId)}
                            />
                            <label
                              htmlFor={`barrel-top-${barrel.barrelId}`}
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

                  {/* Cleaning Run Section - Collapsible Card */}
                  <div className="border rounded-lg p-3 space-y-3">
                    <Collapsible open={addCleaningRun} onOpenChange={setAddCleaningRun}>
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-between h-auto p-0 hover:bg-transparent"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            <span className="font-medium">Cleaning Run</span>
                            {addCleaningRun && (parseInt(cleaningDurationDays) > 0 || parseInt(cleaningDurationHours) > 0 || parseInt(cleaningDurationMinutes) > 0) && (
                              <span className="text-muted-foreground text-sm">
                                ({cleaningDurationDays}d {cleaningDurationHours}h {cleaningDurationMinutes}m)
                              </span>
                            )}
                            {!addCleaningRun && (
                              <span className="text-muted-foreground text-sm">(optional)</span>
                            )}
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${addCleaningRun ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-4">
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
                  </div>

                  {/* Advanced Options - Collapsible Card */}
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
                </div>
                <DialogFooter className="flex-shrink-0">
                  <Button variant="outline" onClick={() => setIsAddStageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStage} disabled={addStageMutation.isPending}>
                    {addStageMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Stage
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
                    key={stage.stageRunId}
                    stage={stage}
                    cycleId={cycleId}
                    onComplete={() => openCompleteStageModal(stage)}
                    onEdit={() => openEditStageModal(stage)}
                    onDelete={() => deleteStageRunMutation.mutate(stage.stageRunId)}
                    isCompleting={completeStageMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Planned Stages */}
            {plannedStages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Planned</h3>
                {plannedStages.map((stage: StageRunSummaryDto) => (
                  <StageCard
                    key={stage.stageRunId}
                    stage={stage}
                    cycleId={cycleId}
                    onEdit={() => openEditStageModal(stage)}
                    onDelete={() => deleteStageRunMutation.mutate(stage.stageRunId)}
                    isPlanned
                    canStartEarly={activeStages.length === 0}
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
                    key={stage.stageRunId}
                    stage={stage}
                    cycleId={cycleId}
                    onView={() => openViewStageModal(stage)}
                    onDelete={() => deleteStageRunMutation.mutate(stage.stageRunId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complete Stage Modal */}
      <Dialog open={isCompleteStageOpen} onOpenChange={setIsCompleteStageOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between pr-8">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between pr-8">
              <div>
                <DialogTitle>Edit Stage</DialogTitle>
                <DialogDescription>
                  Edit &quot;{formatStageDisplayName(editStageName, editStageRunNumber, editStageTotalRuns)}&quot;
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

          {editStageIsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Stage Name */}
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

              {/* Duration - Collapsible */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                      {(parseInt(editStageDurationDays) > 0 || parseInt(editStageDurationHours) > 0) && (
                        <span className="text-muted-foreground text-sm">
                          ({editStageDurationDays}d {editStageDurationHours}h)
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <DurationPicker
                    durationDays={editStageDurationDays}
                    durationHours={editStageDurationHours}
                    onDaysChange={setEditStageDurationDays}
                    onHoursChange={setEditStageDurationHours}
                    startDateTime={editStageStartDateTime}
                    hideLabel
                    helperText="Adjust if the stage finished earlier or later than originally planned."
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Result Rating */}
              <div className="space-y-2">
                <Label>How did this stage turn out? (optional)</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditStageResultRating(editStageResultRating === star ? 0 : star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-8 w-8 ${star <= editStageResultRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 self-center text-sm text-muted-foreground">
                    {editStageResultRating > 0 ? `${editStageResultRating}/5` : 'Click to rate'}
                  </span>
                </div>
              </div>

              {/* Advanced Quality Ratings - Collapsible */}
              <Collapsible open={editStageShowAdvancedQuality} onOpenChange={setEditStageShowAdvancedQuality}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    {editStageShowAdvancedQuality ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    {editStageShowAdvancedQuality ? 'Hide' : 'Show'} advanced quality ratings
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Shape/Rounding</Label>
                        <span className="text-sm text-muted-foreground">{editStageShapeRounding}%</span>
                      </div>
                      <Slider
                        value={[editStageShapeRounding]}
                        onValueChange={([v]) => setEditStageShapeRounding(v)}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Scratch Level</Label>
                        <span className="text-sm text-muted-foreground">{editStageScratchLevel}%</span>
                      </div>
                      <Slider
                        value={[editStageScratchLevel]}
                        onValueChange={([v]) => setEditStageScratchLevel(v)}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Pitting/Chips</Label>
                        <span className="text-sm text-muted-foreground">{editStagePitting}%</span>
                      </div>
                      <Slider
                        value={[editStagePitting]}
                        onValueChange={([v]) => setEditStagePitting(v)}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Shine</Label>
                        <span className="text-sm text-muted-foreground">{editStageShine}%</span>
                      </div>
                      <Slider
                        value={[editStageShine]}
                        onValueChange={([v]) => setEditStageShine(v)}
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
                    <Checkbox id="editIssueScratches" checked={editStageIssueScratches} onCheckedChange={(c) => setEditStageIssueScratches(c as boolean)} />
                    <Label htmlFor="editIssueScratches" className="text-sm">Scratches</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="editIssueChips" checked={editStageIssueChips} onCheckedChange={(c) => setEditStageIssueChips(c as boolean)} />
                    <Label htmlFor="editIssueChips" className="text-sm">Chips/Bruises</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="editIssueUnderRounded" checked={editStageIssueUnderRounded} onCheckedChange={(c) => setEditStageIssueUnderRounded(c as boolean)} />
                    <Label htmlFor="editIssueUnderRounded" className="text-sm">Under-rounded</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="editIssueContamination" checked={editStageIssueContamination} onCheckedChange={(c) => setEditStageIssueContamination(c as boolean)} />
                    <Label htmlFor="editIssueContamination" className="text-sm">Grit contamination</Label>
                  </div>
                </div>
              </div>

              {/* Weight After */}
              <WeightInput
                label={
                  editStageWeightBefore
                    ? `Weight After (Before: ${settings?.measurementSystem === 'Metric'
                        ? `${(editStageWeightBefore / 1000).toFixed(2)} kg`
                        : `${(editStageWeightBefore / 453.592).toFixed(1)} lbs`})`
                    : "Weight After (optional)"
                }
                valueGrams={editStageWeightAfterGrams}
                onValueChange={setEditStageWeightAfterGrams}
                barrelCapacityLbs={editStageBarrelCapacity || undefined}
                onValidationChange={(isValid) => setEditStageWeightAfterValidationError(!isValid)}
              />

              {/* Lessons Learned */}
              <div className="space-y-2">
                <Label>Lessons learned (optional)</Label>
                <Textarea
                  placeholder="What would you do differently next time?"
                  value={editStageLessonsLearned}
                  onChange={(e) => setEditStageLessonsLearned(e.target.value)}
                  rows={2}
                />
              </div>

              {/* What's Next */}
              <div className="space-y-2">
                <Label>What&apos;s next? (optional)</Label>
                <RadioGroup value={editStageNextAction} onValueChange={setEditStageNextAction}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="" id="edit-none" />
                    <Label htmlFor="edit-none">Not set</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Advance" id="edit-advance" />
                    <Label htmlFor="edit-advance">Advance to next stage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Repeat" id="edit-repeat" />
                    <Label htmlFor="edit-repeat">Repeat this stage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Abort" id="edit-abort" />
                    <Label htmlFor="edit-abort">Stop here (abort / re-cut stones)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={editStageNotes}
                  onChange={(e) => setEditStageNotes(e.target.value)}
                  placeholder="Any notes about this stage..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStage} disabled={updateStageMutation.isPending || editStageIsLoading}>
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

      {/* Complete Cycle Dialog */}
      <Dialog open={isCompleteCycleOpen} onOpenChange={setIsCompleteCycleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Cycle</DialogTitle>
            <DialogDescription>
              Mark this tumbling cycle as complete. You&apos;ll be able to share it to the gallery afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {hasIncompleteStages && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cannot complete cycle with incomplete stages. Please complete or delete these stages first:
                  <ul className="mt-2 list-disc list-inside">
                    {incompleteStages.map(stage => (
                      <li key={stage.stageRunId}>
                        {stage.stageName} (Run {stage.runNumber}) - <span className="font-medium">{stage.status}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Final Quality Rating (optional)</Label>
              <p className="text-sm text-muted-foreground">
                How would you rate the final results?
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={completeCycleFinalQuality === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCompleteCycleFinalQuality(completeCycleFinalQuality === rating ? 0 : rating)}
                    disabled={hasIncompleteStages}
                  >
                    <Star className={`h-4 w-4 ${completeCycleFinalQuality >= rating ? 'fill-current' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={completeCycleNotes}
                onChange={(e) => setCompleteCycleNotes(e.target.value)}
                placeholder="Any final thoughts about this cycle? What worked well, what would you do differently..."
                rows={3}
                disabled={hasIncompleteStages}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteCycleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => completeCycleMutation.mutate({
              finalQuality: completeCycleFinalQuality > 0 ? completeCycleFinalQuality : undefined,
              notes: completeCycleNotes || undefined,
            })} disabled={completeCycleMutation.isPending || hasIncompleteStages}>
              {completeCycleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Stage Modal */}
      <Dialog open={isViewStageOpen} onOpenChange={(open) => {
        setIsViewStageOpen(open);
        if (!open) setViewStageId(null);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {viewStageData ? formatStageDisplayName(viewStageData.stageName, viewStageData.runNumber, viewStageData.totalRuns) : 'Stage Details'}
            </DialogTitle>
            <DialogDescription>
              Completed stage run details
            </DialogDescription>
          </DialogHeader>
          {viewStageLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : viewStageData ? (
            <div className="space-y-6 py-4">
              {/* Timing */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">{new Date(viewStageData.startDateTime).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {viewStageData.endDateTime
                      ? new Date(viewStageData.endDateTime).toLocaleString()
                      : 'In Progress'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {viewStageData.durationDays > 0 && `${viewStageData.durationDays}d `}
                    {viewStageData.durationHours > 0 && `${viewStageData.durationHours}h`}
                    {viewStageData.durationDays === 0 && viewStageData.durationHours === 0 && '< 1h'}
                  </p>
                </div>
                {viewStageData.resultRating && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Result Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= viewStageData.resultRating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                      <span className="ml-1 text-sm">{viewStageData.resultRating}/5</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Barrels */}
              {viewStageData.barrels && viewStageData.barrels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Barrels Used</p>
                  <div className="flex flex-wrap gap-2">
                    {viewStageData.barrels.map((barrel) => (
                      <Badge key={barrel.barrelId} variant="secondary">
                        {barrel.nickname || `Barrel #${barrel.barrelNumber}`}
                        {barrel.capacityLbs && ` (${barrel.capacityLbs}lb)`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Load Details */}
              {(viewStageData.loadWeightBeforeGrams || viewStageData.fillLevelPercent || viewStageData.waterLevel || viewStageData.waterAmountMl) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Load Details</p>
                  <div className="grid gap-3 sm:grid-cols-2 p-3 bg-muted/50 rounded-lg">
                    {viewStageData.loadWeightBeforeGrams && (
                      <div>
                        <span className="text-sm text-muted-foreground">Load Weight:</span>
                        <span className="ml-2">{viewStageData.loadWeightBeforeGrams}g</span>
                      </div>
                    )}
                    {viewStageData.fillLevelPercent && (
                      <div>
                        <span className="text-sm text-muted-foreground">Fill Level:</span>
                        <span className="ml-2">{viewStageData.fillLevelPercent}%</span>
                      </div>
                    )}
                    {viewStageData.waterLevel && (
                      <div>
                        <span className="text-sm text-muted-foreground">Water Level:</span>
                        <span className="ml-2">{viewStageData.waterLevel}</span>
                      </div>
                    )}
                    {viewStageData.waterAmountMl && (
                      <div>
                        <span className="text-sm text-muted-foreground">Water Amount:</span>
                        <span className="ml-2">{viewStageData.waterAmountMl}ml</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Materials */}
              {viewStageData.materials && viewStageData.materials.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Materials Used</p>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <ul className="space-y-1">
                      {viewStageData.materials.map((mat) => (
                        <li key={mat.stageMaterialId} className="text-sm flex justify-between">
                          <span>{mat.materialName}</span>
                          {mat.displayAmount && (
                            <span className="text-muted-foreground">
                              {mat.displayAmount} {mat.displayUnit || ''}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Cleaning Run */}
              {viewStageData.cleaningRun && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Cleaning Run
                  </p>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDurationMinutes(viewStageData.cleaningRun.durationMinutes)}</span>
                    </div>
                    {viewStageData.cleaningRun.purpose && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purpose:</span>
                        <span>{formatCleaningPurpose(viewStageData.cleaningRun.purpose)}</span>
                      </div>
                    )}
                    {viewStageData.cleaningRun.materials && viewStageData.cleaningRun.materials.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Materials:</span>
                        <ul className="mt-1 ml-4 list-disc text-xs">
                          {viewStageData.cleaningRun.materials.map((mat, idx) => (
                            <li key={idx}>
                              {mat.materialName}
                              {mat.displayAmount && ` - ${mat.displayAmount} ${mat.displayUnit || ''}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {viewStageData.cleaningRun.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1 text-xs">{viewStageData.cleaningRun.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Action */}
              {viewStageData.nextAction && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Next Action</p>
                  <p className="text-sm p-3 bg-muted/50 rounded-lg">{viewStageData.nextAction}</p>
                </div>
              )}

              {/* Notes */}
              {viewStageData.notes && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{viewStageData.notes}</p>
                </div>
              )}

              {/* Photos */}
              {viewStageData.photos && viewStageData.photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Photos ({viewStageData.photos.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {viewStageData.photos.slice(0, 6).map((photo) => (
                      <div key={photo.photoId} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element -- External R2 URLs with dynamic dimensions */}
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.caption || 'Stage photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {viewStageData.photos.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{viewStageData.photos.length - 6} more photos
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewStageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photos */}
      <CyclePhotos cycleId={cycleId} stages={cycle?.stageRuns || []} />
      </div>
    </PageTransition>
  );
}

function StageCard({
  stage,
  onComplete,
  onEdit,
  onDelete,
  onView,
  onStartEarly: _onStartEarly,
  isCompleting,
  isStartingEarly: _isStartingEarly,
  cycleId,
  isPlanned,
  canStartEarly: _canStartEarly,
}: {
  stage: StageRunSummaryDto;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onStartEarly?: () => void;
  isCompleting?: boolean;
  isStartingEarly?: boolean;
  cycleId: string;
  isPlanned?: boolean;
  canStartEarly?: boolean;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stageDetails, setStageDetails] = useState<StageRunDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const isActive = stage.status === 'Active';
  const startDate = new Date(stage.startDateTime);
  // Use durationEstimateEndDate for active/planned stages, endDateTime for completed
  const effectiveEndDate = stage.endDateTime
    ? new Date(stage.endDateTime)
    : stage.durationEstimateEndDate
      ? new Date(stage.durationEstimateEndDate)
      : null;
  const now = new Date();
  const isOverdue = isActive && effectiveEndDate && effectiveEndDate < now;
  const displayName = formatStageDisplayName(stage.stageName, stage.runNumber, stage.totalRuns);

  // Calculate progress (only if we have an end date)
  const totalDuration = effectiveEndDate ? effectiveEndDate.getTime() - startDate.getTime() : 0;
  const elapsed = now.getTime() - startDate.getTime();
  const progressPercent = isActive && totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : (stage.status === 'Completed' ? 100 : 0);

  const totalDays = totalDuration > 0 ? Math.ceil(totalDuration / (1000 * 60 * 60 * 24)) : 0;
  const currentDay = Math.ceil(elapsed / (1000 * 60 * 60 * 24));

  const timeRemaining = isActive && effectiveEndDate ? getTimeRemaining(effectiveEndDate) : null;

  // Load stage details when collapsible is opened
  const loadStageDetails = async () => {
    if (stageDetails) return; // Already loaded
    setIsLoadingDetails(true);
    try {
      const details = await cycleApi.getStageRun(stage.stageRunId);
      setStageDetails(details);
    } catch (error) {
      console.error('Failed to load stage details:', error);
      toast.error('Failed to load stage details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDetailsToggle = (open: boolean) => {
    setIsDetailsOpen(open);
    if (open) {
      loadStageDetails();
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete?.();
  };

  const handlePhotoUploadComplete = () => {
    // Refresh stage details to show new photos
    setStageDetails(null);
    loadStageDetails();
    // Also invalidate cycle query to update photo count
    queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
  };

  // Format duration for display
  const formatDuration = (days: number, hours: number) => {
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    return parts.length > 0 ? parts.join(' ') : '0h';
  };

  return (
    <>
      <div className={`p-2.5 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer ${
        isOverdue ? 'border-yellow-300 bg-yellow-50/50' :
        isPlanned ? 'border-dashed border-muted-foreground/50 bg-muted/30' :
        'bg-card'
      }`}>
        {/* Main row: icon + name + progress + actions - clickable to toggle details */}
        <div
          className="flex items-center gap-2"
          onClick={() => handleDetailsToggle(!isDetailsOpen)}
        >
          <div className={`p-1.5 rounded-full shrink-0 ${
            isPlanned ? 'bg-slate-100' :
            isActive ? 'bg-blue-100' :
            'bg-green-100'
          }`}>
            {isPlanned ? (
              <Clock className="h-3 w-3 text-slate-500" />
            ) : isActive ? (
              <Play className="h-3 w-3 text-blue-600" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            )}
          </div>

          {/* Name and status */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={`font-medium text-sm truncate ${isPlanned ? 'text-muted-foreground' : ''}`}>{displayName}</p>
              {isPlanned && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">
                  Scheduled
                </Badge>
              )}
              {stage.resultRating && (
                <Badge variant="outline" className="gap-0.5 text-[10px] px-1 py-0 h-4">
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                  {stage.resultRating}
                </Badge>
              )}
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
            </div>
            <p className="text-xs text-muted-foreground">
              {isPlanned ? (
                <>Scheduled for {startDate.toLocaleDateString()}{effectiveEndDate && <> · ~{totalDays}d duration</>}</>
              ) : isActive && effectiveEndDate ? (
                (() => {
                  const progressText = getStageProgressText(startDate, effectiveEndDate);
                  const isOverdueText = progressText.includes('overdue') || progressText === 'Due Today';
                  return isOverdueText ? (
                    <span className="text-yellow-600">Started {startDate.toLocaleDateString()} · {progressText}</span>
                  ) : (
                    <>Started {startDate.toLocaleDateString()} · {progressText}</>
                  );
                })()
              ) : (
                <>{startDate.toLocaleDateString()}{effectiveEndDate && <> → {effectiveEndDate.toLocaleDateString()}</>}</>
              )}
            </p>
          </div>

          {/* Progress bar (active only) */}
          {isActive && (
            <div className="w-16 sm:w-24 shrink-0">
              <Progress value={progressPercent} className={`h-1.5 ${isOverdue ? '[&>div]:bg-yellow-500' : ''}`} />
            </div>
          )}

          {/* Action buttons - stop propagation so clicks don't toggle details */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Edit button for active and planned stages */}
            {(isActive || isPlanned) && onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {isActive && onComplete && (
              <Button size="sm" onClick={onComplete} disabled={isCompleting} className="h-7 px-2">
                {isCompleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isActive && onView && (
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onView(); }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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

        {/* Stage Details Collapsible */}
        <Collapsible open={isDetailsOpen} onOpenChange={handleDetailsToggle}>
          <CollapsibleTrigger className="hidden" />
            <CollapsibleContent>
              <div className="mt-1.5 p-2 sm:p-3 bg-muted/50 rounded-lg space-y-2 text-xs sm:text-sm">
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : stageDetails ? (
                  <>
                    {/* Duration */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(stageDetails.durationDays, stageDetails.durationHours)}</span>
                    </div>

                    {/* End Date - show estimate for active, actual for completed */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>
                        {stageDetails.endDateTime
                          ? new Date(stageDetails.endDateTime).toLocaleDateString()
                          : stageDetails.durationEstimateEndDate
                            ? `~${new Date(stageDetails.durationEstimateEndDate).toLocaleDateString()}`
                            : '-'}
                      </span>
                    </div>

                    {/* Barrel */}
                    {stageDetails.barrels && stageDetails.barrels.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Barrel:</span>
                        <span>
                          {stageDetails.barrels.map(b =>
                            b.nickname ? `#${b.barrelNumber} ${b.nickname}` : `#${b.barrelNumber}`
                          ).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Materials */}
                    {stageDetails.materials && stageDetails.materials.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Materials:</span>
                        <ul className="mt-1 ml-4 list-disc text-xs">
                          {stageDetails.materials.map((mat) => (
                            <li key={mat.stageMaterialId}>
                              {mat.materialName}
                              {mat.displayAmount && ` - ${mat.displayAmount} ${mat.displayUnit || ''}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weight */}
                    {stageDetails.loadWeightBeforeGrams && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight Before:</span>
                        <span>{stageDetails.loadWeightBeforeGrams}g</span>
                      </div>
                    )}
                    {stageDetails.loadWeightAfterGrams && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight After:</span>
                        <span>
                          {stageDetails.loadWeightAfterGrams}g
                          {stageDetails.loadWeightBeforeGrams && stageDetails.loadWeightBeforeGrams > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({((stageDetails.loadWeightBeforeGrams - stageDetails.loadWeightAfterGrams) / stageDetails.loadWeightBeforeGrams * 100).toFixed(1)}% loss)
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Fill Level */}
                    {stageDetails.fillLevelPercent && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fill Level:</span>
                        <span>{stageDetails.fillLevelPercent}%</span>
                      </div>
                    )}

                    {/* Water Amount */}
                    {stageDetails.waterAmountMl && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Water:</span>
                        <span>{stageDetails.waterAmountMl} ml</span>
                      </div>
                    )}

                    {/* Notes */}
                    {stageDetails.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1 text-xs">{stageDetails.notes}</p>
                      </div>
                    )}

                    {/* Photos */}
                    <div className="pt-1.5 border-t">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <ImageIcon className="h-3.5 w-3.5" />
                          Photos ({stageDetails.photos?.length || 0})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadModalOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="hidden sm:inline ml-1">Add</span>
                        </Button>
                      </div>
                      {stageDetails.photos && stageDetails.photos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {stageDetails.photos.map((photo) => (
                            <div key={photo.photoId} className="relative aspect-square">
                              {/* eslint-disable-next-line @next/next/no-img-element -- External R2 URLs with dynamic dimensions */}
                              <img
                                src={photo.thumbnailUrl || photo.url}
                                alt={photo.caption || photo.fileName || 'Photo'}
                                className="w-full h-full object-cover rounded"
                              />
                              <span className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/50 rounded text-white text-[8px] capitalize">
                                {photo.photoType}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-1.5">
                          No photos yet
                        </p>
                      )}
                    </div>

                    {/* Cleaning Run */}
                    {stage.cleaningRun && (
                      <div className="pt-1.5 border-t">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-muted-foreground font-medium text-xs">Cleaning</span>
                        </div>
                        <div className="ml-5 space-y-0.5">
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
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </CollapsibleContent>
          </Collapsible>
      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        stages={[stage]}
        onUploadComplete={handlePhotoUploadComplete}
        defaultStageId={stage.stageRunId}
      />
    </>
  );
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
