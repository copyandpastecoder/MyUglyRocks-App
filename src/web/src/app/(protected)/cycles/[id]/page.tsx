'use client';

import { useState, useEffect, useRef } from 'react';
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
  Star,
  ChevronDown,
  ChevronUp,
  Pencil,
  Sparkles,
  Lightbulb,
  Eye,
  Image as ImageIcon,
  Trophy,
  PartyPopper,
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
import { StageFormModal, type BarrelInfo } from '@/components/stage/stage-form-modal';
import { CycleFormDialog } from '@/components/cycle-form-dialog';
import {
  CleaningRunSection,
} from '@/components/stage';
import { useSettings, useTimezone } from '@/hooks/use-user';
import { useMaterials } from '@/hooks/use-materials';
import { calculateDurationFromDates } from '@/lib/date-utils';
import { convertMinutesToDaysHoursMinutes, formatDurationMinutes } from '@/lib/duration-utils';
import { formatCleaningPurpose } from '@/lib/cleaning-constants';
import { formatStageDisplayName, getStageProgressText } from '@/lib/cycle-utils';
import type { StageRunSummaryDto, StageRunDto, CompleteStageRunRequest, CleaningRunDto, CompleteCycleRequest } from '@/types/cycle';
import { PageTransition } from '@/components/ui/page-transition';
import { useConfetti } from '@/components/ui/confetti';

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const cycleId = params.id as string;

  // Track if we've already handled the addStage query param (ref since no re-render needed)
  const hasHandledAddStageRef = useRef(false);

  // Stage Form Modal State (shared for New and Edit)
  const [isStageFormOpen, setIsStageFormOpen] = useState(false);
  const [editStageId, setEditStageId] = useState<string | undefined>(undefined);

  // Complete Stage Modal State
  const [isCompleteStageOpen, setIsCompleteStageOpen] = useState(false);
  const [completeStageId, setCompleteStageId] = useState<string | null>(null);
  const [completeStageName, setCompleteStageName] = useState<string>('');
  const [completeStageRunNumber, setCompleteStageRunNumber] = useState<number>(1);
  const [completeStageTotalRuns, setCompleteStageTotalRuns] = useState<number>(1);
  const [completeStageStartDateTime, setCompleteStageStartDateTime] = useState<string>('');
  const [completeStageDurationDays, setCompleteStageDurationDays] = useState<string>('7');
  const [completeStageDurationHours, setCompleteStageDurationHours] = useState<string>('0');
  const [completeStageDurationMinutes, setCompleteStageDurationMinutes] = useState<string>('0');
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
  const [nextAction, setNextAction] = useState<string>('');
  const [nextActionError, setNextActionError] = useState(false);
  const [loadWeightAfterGrams, setLoadWeightAfterGrams] = useState<number | null>(null);
  const [weightAfterValidationError, setWeightAfterValidationError] = useState(false);
  // Barrel capacity for the stage being completed (for validation)
  const [completeStageBarrelCapacity, setCompleteStageBarrelCapacity] = useState<number | null>(null);
  // Cleaning run info for Complete Stage modal (read-only display of existing)
  const [completeStageCleaningRun, setCompleteStageCleaningRun] = useState<CleaningRunDto | null>(null);
  // Editable cleaning run state for Complete Stage modal
  const [completeStageEditableCleaningRun, setCompleteStageEditableCleaningRun] = useState<{
    enabled: boolean;
    cleaningRunId?: string;
    durationDays: string;
    durationHours: string;
    durationMinutes: string;
    purpose: string;
    notes: string;
    materials: Array<{ materialId: string; displayAmount: string; displayUnit: string }>;
  }>({
    enabled: false,
    durationDays: '0',
    durationHours: '0',
    durationMinutes: '0',
    purpose: '',
    notes: '',
    materials: [],
  });
  // Weight before (from when stage was started)
  const [completeStageWeightBefore, setCompleteStageWeightBefore] = useState<number | null>(null);

  // Edit Cycle Dialog State
  const [isEditCycleOpen, setIsEditCycleOpen] = useState(false);

  // Cleaning Run Modal State
  const [isCleaningRunOpen, setIsCleaningRunOpen] = useState(false);
  const [cleaningRunStageId] = useState<string | null>(null);
  const [cleaningRunStageName] = useState('');

  // Complete Cycle Dialog State
  const [isCompleteCycleOpen, setIsCompleteCycleOpen] = useState(false);
  const [completeCycleFinalQuality, setCompleteCycleFinalQuality] = useState<number>(0);
  const [completeCycleNotes, setCompleteCycleNotes] = useState('');

  // Confetti for cycle completion celebration
  const { fire: fireConfetti, Confetti } = useConfetti();

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
  const { toUserTz, isToday, now: getNow, formatForInput, formatDate } = useTimezone();

  // Query for viewing stage details
  const { data: viewStageData, isLoading: viewStageLoading } = useQuery({
    queryKey: ['stage', viewStageId],
    queryFn: () => cycleApi.getStageRun(viewStageId!),
    enabled: !!viewStageId && isViewStageOpen,
  });

  // Auto-open Add Stage dialog when ?addStage=true query param is present
  useEffect(() => {
    const shouldOpenAddStage = searchParams.get('addStage') === 'true';
    if (shouldOpenAddStage && cycle && cycle.status === 'Active' && !hasHandledAddStageRef.current) {
      hasHandledAddStageRef.current = true;
      // Use setTimeout to ensure all data is ready
      setTimeout(() => {
        // Open add stage modal (inline to avoid TDZ)
        setEditStageId(undefined);
        setIsStageFormOpen(true);
        // Remove the query param from URL to prevent re-opening on page refresh
        router.replace(`/cycles/${cycleId}`, { scroll: false });
      }, 100);
    }
  }, [searchParams, cycle, cycleId, router]);

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
      const shouldCompleteCycle = variables.data.nextAction === 'Complete';

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
      } else if (shouldCompleteCycle) {
        // Open the Complete Cycle modal
        toast.success('Stage completed! Now complete your cycle.');
        queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
        queryClient.invalidateQueries({ queryKey: ['cycles'] });
        setIsCompleteStageOpen(false);
        resetCompleteStageForm();
        setIsCompleteCycleOpen(true);
        return;
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

  const completeCycleMutation = useMutation({
    mutationFn: (data: CompleteCycleRequest) => cycleApi.complete(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Cycle completed! You can now share it to the gallery.');
      setIsCompleteCycleOpen(false);
      setCompleteCycleFinalQuality(0);
      setCompleteCycleNotes('');
      // Celebrate with confetti!
      fireConfetti();
    },
    onError: () => {
      toast.error('Failed to complete cycle');
    },
  });

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
    setNextAction('');
    setLoadWeightAfterGrams(null);
    setWeightAfterValidationError(false);
    setCompleteStageBarrelCapacity(null);
    setCompleteStageCleaningRun(null);
    setCompleteStageWeightBefore(null);
  };

  // Open stage form modal for creating new stage
  const openAddStageModal = () => {
    setEditStageId(undefined);
    setIsStageFormOpen(true);
  };

  // Open stage form modal for editing existing stage
  const openEditStageModal = (stage: StageRunSummaryDto) => {
    setEditStageId(stage.stageRunId);
    setIsStageFormOpen(true);
  };

  const openCompleteStageModal = async (stage: StageRunSummaryDto) => {
    // Convert UTC start date to user's timezone
    const startDateInTz = toUserTz(stage.startDateTime);
    if (!startDateInTz) return;

    // Use durationEstimateEndDate for active stages (endDateTime is null until completed)
    const endDateString = stage.endDateTime ?? stage.durationEstimateEndDate;
    let endDateInTz = endDateString ? toUserTz(endDateString) : getNow();
    if (!endDateInTz) endDateInTz = getNow();

    // If end date is today in user's timezone, use current time instead
    const endDateIsToday = isToday(endDateString);
    if (endDateIsToday && !stage.endDateTime) {
      endDateInTz = getNow();
    }

    const { days, hours, minutes } = calculateDurationFromDates(startDateInTz, endDateInTz);

    setCompleteStageId(stage.stageRunId);
    setCompleteStageName(stage.stageName);
    setCompleteStageRunNumber(stage.runNumber);
    setCompleteStageTotalRuns(stage.totalRuns);
    setCompleteStageStartDateTime(formatForInput(stage.startDateTime)); // Format for display in user's timezone
    setCompleteStageDurationDays(String(days));
    setCompleteStageDurationHours(String(hours));
    setCompleteStageDurationMinutes(String(minutes));
    // Store cleaning run info for display
    setCompleteStageCleaningRun(stage.cleaningRun);
    // Initialize editable cleaning run from existing data or reset
    if (stage.cleaningRun) {
      const { days, hours, mins } = convertMinutesToDaysHoursMinutes(stage.cleaningRun.durationMinutes);
      setCompleteStageEditableCleaningRun({
        enabled: true,
        cleaningRunId: stage.cleaningRun.cleaningRunId,
        durationDays: String(days),
        durationHours: String(hours),
        durationMinutes: String(mins),
        purpose: stage.cleaningRun.purpose || '',
        notes: stage.cleaningRun.notes || '',
        materials: stage.cleaningRun.materials?.map(m => ({
          materialId: m.materialId,
          displayAmount: m.displayAmount?.toString() || '',
          displayUnit: m.displayUnit || 'tbsp',
        })) || [],
      });
    } else {
      setCompleteStageEditableCleaningRun({
        enabled: false,
        durationDays: '0',
        durationHours: '0',
        durationMinutes: '0',
        purpose: '',
        notes: '',
        materials: [],
      });
    }
    // Reset form state
    setNextAction('');
    setNextActionError(false);
    setResultRating(0);
    setLessonsLearned('');
    setLoadWeightAfterGrams(null);
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

  const handleCompleteStage = async () => {
    if (!completeStageId) return;

    // Result rating is only required for Polish stage
    const isPolishStage = completeStageName.toLowerCase() === 'polish';
    if (isPolishStage && resultRating === 0) {
      toast.error('Please rate the stage result (1-5 stars)');
      return;
    }

    // What's next is always required
    if (!nextAction) {
      setNextActionError(true);
      toast.error('Please select what\'s next for this cycle', { duration: 5000 });
      return;
    }

    // Validate weight after if entered
    if (weightAfterValidationError) {
      toast.error('Weight exceeds 150% of barrel capacity. Please correct before saving.');
      return;
    }

    // Handle cleaning run - add if enabled and new (no existing cleaningRunId)
    if (completeStageEditableCleaningRun.enabled && !completeStageEditableCleaningRun.cleaningRunId) {
      const totalMinutes =
        (parseInt(completeStageEditableCleaningRun.durationDays) || 0) * 1440 +
        (parseInt(completeStageEditableCleaningRun.durationHours) || 0) * 60 +
        (parseInt(completeStageEditableCleaningRun.durationMinutes) || 0);

      if (totalMinutes > 0) {
        try {
          const cleaningMaterials = completeStageEditableCleaningRun.materials
            .filter(m => m.materialId)
            .map(m => ({
              materialId: m.materialId,
              displayAmount: m.displayAmount ? parseFloat(m.displayAmount) : undefined,
              displayUnit: m.displayUnit || undefined,
            }));

          await cycleApi.addCleaningRun(completeStageId, {
            durationMinutes: totalMinutes,
            purpose: completeStageEditableCleaningRun.purpose || undefined,
            notes: completeStageEditableCleaningRun.notes || undefined,
            materials: cleaningMaterials.length > 0 ? cleaningMaterials : undefined,
          });
        } catch {
          toast.error('Failed to add cleaning run');
          return;
        }
      }
    }

    // Calculate the actual end date from start date + duration
    const days = parseInt(completeStageDurationDays) || 0;
    const hours = parseInt(completeStageDurationHours) || 0;
    const mins = parseInt(completeStageDurationMinutes) || 0;
    const startDate = new Date(completeStageStartDateTime);

    // Guard against invalid start date
    if (isNaN(startDate.getTime())) {
      toast.error('Invalid start date. Please refresh and try again.');
      return;
    }

    const actualEndDate = new Date(startDate.getTime() + ((days * 24 + hours) * 60 + mins) * 60 * 1000);

    const data: CompleteStageRunRequest = {
      resultRating: resultRating > 0 ? resultRating : undefined,  // Only send if rated (1-5)
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


  const openViewStageModal = (stage: StageRunSummaryDto) => {
    setViewStageId(stage.stageRunId);
    setIsViewStageOpen(true);
  };

  // Get all active barrels from all active tumblers
  const allBarrels: BarrelInfo[] = tumblers?.flatMap(t =>
    t.isActive && t.barrels
      ? t.barrels.filter(b => b.isActive).map(b => ({
          ...b,
          tumblerName: `${t.brand} ${t.model || ''}`.trim(),
          tumblerId: t.tumblerId,
        }))
      : []
  ) || [];

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
      {/* Confetti celebration for cycle completion */}
      <Confetti />

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
        <Card className={cycle.status === 'Completed' ? 'border-green-500/50 bg-gradient-to-br from-green-500/5 to-transparent dark:from-green-500/10' : ''}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Title and metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {cycle.status === 'Completed' ? (
                      <Badge className="text-xs shrink-0 bg-green-600 hover:bg-green-600 text-white gap-1">
                        <Trophy className="h-3 w-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs shrink-0">
                        {cycle.status}
                      </Badge>
                    )}
                    <CardTitle className="text-base sm:text-lg leading-tight truncate">{cycle.name}</CardTitle>
                    {cycle.status === 'Completed' && (
                      <PartyPopper className="h-4 w-4 text-green-500 shrink-0" />
                    )}
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
                        <span className="text-yellow-500 font-medium">{cycle.finalQuality}/5 ★</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions and chevron */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {cycle.status === 'Active' && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditCycleOpen(true)}>
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
                <p className="font-medium">{formatDate(cycle.startDate, 'MMM d, yyyy')}</p>
              </div>
              {cycle.status === 'Completed' && cycle.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">{formatDate(cycle.endDate, 'MMM d, yyyy')}</p>
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
                  <p className="font-medium">{formatDate(cycle.lastUpdated, 'MMM d, yyyy')}</p>
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
            <Button onClick={openAddStageModal}>
              <Plus className="mr-2 h-4 w-4" />
              New Stage
            </Button>
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
                    {(parseInt(completeStageDurationDays) > 0 || parseInt(completeStageDurationHours) > 0 || parseInt(completeStageDurationMinutes) > 0) && (
                      <span className="text-muted-foreground text-sm">
                        ({completeStageDurationDays}d {completeStageDurationHours}h {completeStageDurationMinutes}m)
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
                  durationMinutes={completeStageDurationMinutes}
                  onDaysChange={setCompleteStageDurationDays}
                  onHoursChange={setCompleteStageDurationHours}
                  onMinutesChange={setCompleteStageDurationMinutes}
                  startDateTime={completeStageStartDateTime}
                  hideLabel
                  helperText="Adjust if the stage finished earlier or later than originally planned."
                />
              </CollapsibleContent>
            </Collapsible>

            {/* End Date Not Today Warning */}
            {(() => {
              const days = parseInt(completeStageDurationDays) || 0;
              const hours = parseInt(completeStageDurationHours) || 0;
              const mins = parseInt(completeStageDurationMinutes) || 0;
              const startDate = new Date(completeStageStartDateTime);

              // Guard against invalid start date
              if (isNaN(startDate.getTime())) return null;

              const endDate = new Date(startDate.getTime() + ((days * 24 + hours) * 60 + mins) * 60 * 1000);
              const nowDate = getNow();

              // Check if end date's date (ignoring time) is not today's date
              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              const todayOnly = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
              const isNotToday = endDateOnly.getTime() !== todayOnly.getTime();

              if (!isNotToday) return null;

              const isFuture = endDate > nowDate;
              const handleSetToNow = () => {
                const start = new Date(completeStageStartDateTime);
                const now = getNow();
                const { days: newDays, hours: newHours, minutes: newMins } = calculateDurationFromDates(start, now);
                setCompleteStageDurationDays(String(newDays));
                setCompleteStageDurationHours(String(newHours));
                setCompleteStageDurationMinutes(String(newMins));
              };

              const formattedEndDate = formatDate(endDate.toISOString(), 'MMM d, yyyy h:mm a');

              return (
                <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-yellow-800 dark:text-yellow-200">
                      End date is <strong>{formattedEndDate}</strong> ({isFuture ? 'in the future' : 'in the past'})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetToNow}
                      className="ml-2 border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-200 dark:hover:bg-yellow-900/30"
                    >
                      Set to Now
                    </Button>
                  </AlertDescription>
                </Alert>
              );
            })()}

            {/* Cleaning Run Section */}
            <CleaningRunSection
              data={{
                enabled: completeStageEditableCleaningRun.enabled,
                durationDays: completeStageEditableCleaningRun.durationDays,
                durationHours: completeStageEditableCleaningRun.durationHours,
                durationMinutes: completeStageEditableCleaningRun.durationMinutes,
                purpose: completeStageEditableCleaningRun.purpose,
                notes: completeStageEditableCleaningRun.notes,
                materials: completeStageEditableCleaningRun.materials,
              }}
              availableMaterials={materials || []}
              onChange={(data) => setCompleteStageEditableCleaningRun({
                ...completeStageEditableCleaningRun,
                enabled: data.enabled,
                durationDays: data.durationDays,
                durationHours: data.durationHours,
                durationMinutes: data.durationMinutes,
                purpose: data.purpose,
                notes: data.notes,
                materials: data.materials,
              })}
            />

            {/* Result Rating */}
            <div className="space-y-2">
              <Label>How did this stage turn out?{completeStageName.toLowerCase() === 'polish' ? ' *' : ' (optional)'}</Label>
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

            {/* Next Action Selection */}
            <div className={`rounded-lg border-2 shadow-md transition-all ${
              nextActionError
                ? 'border-destructive bg-destructive/5 animate-pulse'
                : 'border-primary/30 bg-primary/5'
            }`}>
              <div className="px-4 py-3 border-b border-primary/20">
                <Label className={`text-base font-semibold ${nextActionError ? 'text-destructive' : ''}`}>
                  Please Choose <span className="text-destructive">*required</span>
                </Label>
              </div>
              <div className="p-4">
                <RadioGroup
                  value={nextAction}
                  onValueChange={(value) => {
                    setNextAction(value);
                    setNextActionError(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Advance" id="advance" />
                    <Label htmlFor="advance">Advance to next stage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Repeat" id="repeat" />
                    <Label htmlFor="repeat">Repeat this stage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Complete" id="complete" />
                    <Label htmlFor="complete">Cycle Complete (No more ugly rocks!)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Abort" id="abort" />
                    <Label htmlFor="abort">Stop here (abort / re-cut stones)</Label>
                  </div>
                </RadioGroup>
              </div>
              {nextActionError && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-destructive font-medium">
                    Please select what happens next
                  </p>
                </div>
              )}
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
      <CycleFormDialog
        open={isEditCycleOpen}
        onOpenChange={setIsEditCycleOpen}
        cycle={cycle}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] })}
      />

      {/* Stage Form Modal (New and Edit) */}
      {cycle && (
        <StageFormModal
          open={isStageFormOpen}
          onOpenChange={setIsStageFormOpen}
          cycleId={cycleId}
          cycle={cycle}
          stageRunId={editStageId}
          allBarrels={allBarrels}
          materials={materials || []}
          onSuccess={() => {
            setIsStageFormOpen(false);
            setEditStageId(undefined);
          }}
        />
      )}

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
                  <p className="font-medium">{formatDate(viewStageData.startDateTime, 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {viewStageData.endDateTime
                      ? formatDate(viewStageData.endDateTime, 'MMM d, yyyy h:mm a')
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
              {(viewStageData.loadWeightBeforeGrams || viewStageData.waterAmountMl) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Load Details</p>
                  <div className="grid gap-3 sm:grid-cols-2 p-3 bg-muted/50 rounded-lg">
                    {viewStageData.loadWeightBeforeGrams && (
                      <div>
                        <span className="text-sm text-muted-foreground">Load Weight:</span>
                        <span className="ml-2">{viewStageData.loadWeightBeforeGrams}g</span>
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
  isCompleting,
  cycleId,
  isPlanned,
}: {
  stage: StageRunSummaryDto;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  isCompleting?: boolean;
  cycleId: string;
  isPlanned?: boolean;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stageDetails, setStageDetails] = useState<StageRunDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toUserTz, now: getNow, formatDate } = useTimezone();

  const isActive = stage.status === 'Active';
  // Convert UTC dates to user's timezone
  const startDate = toUserTz(stage.startDateTime) || new Date(stage.startDateTime);
  // Use durationEstimateEndDate for active/planned stages, endDateTime for completed
  const effectiveEndDate = stage.endDateTime
    ? toUserTz(stage.endDateTime)
    : stage.durationEstimateEndDate
      ? toUserTz(stage.durationEstimateEndDate)
      : null;
  const now = getNow();
  const isOverdue = isActive && effectiveEndDate && effectiveEndDate < now;
  const displayName = formatStageDisplayName(stage.stageName, stage.runNumber, stage.totalRuns);

  // Calculate progress (only if we have an end date)
  const totalDuration = effectiveEndDate ? effectiveEndDate.getTime() - startDate.getTime() : 0;
  const elapsed = now.getTime() - startDate.getTime();
  const progressPercent = isActive && totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : (stage.status === 'Completed' ? 100 : 0);

  const totalDays = totalDuration > 0 ? Math.ceil(totalDuration / (1000 * 60 * 60 * 24)) : 0;

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
                <>Scheduled for {formatDate(stage.startDateTime, 'MMM d, yyyy')}{effectiveEndDate && <> · ~{totalDays}d duration</>}</>
              ) : isActive && effectiveEndDate ? (
                (() => {
                  const progressText = getStageProgressText(startDate, effectiveEndDate);
                  const isOverdueText = progressText.includes('overdue') || progressText === 'Due Today';
                  return isOverdueText ? (
                    <span className="text-yellow-600">Started {formatDate(stage.startDateTime, 'MMM d, yyyy')} · {progressText}</span>
                  ) : (
                    <>Started {formatDate(stage.startDateTime, 'MMM d, yyyy')} · {progressText}</>
                  );
                })()
              ) : (
                <>{formatDate(stage.startDateTime, 'MMM d, yyyy')}{effectiveEndDate && <> → {formatDate(stage.endDateTime || stage.durationEstimateEndDate, 'MMM d, yyyy')}</>}</>
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
                          ? formatDate(stageDetails.endDateTime, 'MMM d, yyyy')
                          : stageDetails.durationEstimateEndDate
                            ? `~${formatDate(stageDetails.durationEstimateEndDate, 'MMM d, yyyy')}`
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
