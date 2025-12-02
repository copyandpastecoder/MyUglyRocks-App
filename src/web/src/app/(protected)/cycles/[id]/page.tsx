'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { PhotoUploadPlaceholder } from '@/components/photo-upload-placeholder';
import { useSettings } from '@/hooks/use-user';
import { useMaterials } from '@/hooks/use-materials';
import type { StageRunSummaryDto, CreateStageMaterialRequest, CompleteStageRunRequest, UpdateCycleRequest, UpdateStageRunRequest } from '@/types/cycle';
import type { BarrelDto } from '@/types/tumbler';

const STAGE_NAMES = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish'];
const DURATION_PRESETS = [3, 5, 7, 10, 14];
const WATER_LEVELS = [
  { value: 'JustCovering', label: 'Just covering' },
  { value: 'Halfway', label: 'Halfway' },
  { value: 'ThreeQuarters', label: '3/4 full' },
  { value: 'Full', label: 'Full' },
];

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cycleId = params.id as string;

  // Add Stage Dialog State
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [selectedBarrelIds, setSelectedBarrelIds] = useState<string[]>([]);
  const [stageName, setStageName] = useState<string>('Coarse');
  const [stageStartDateTime, setStageStartDateTime] = useState<string>('');
  const [durationDays, setDurationDays] = useState<string>('7');
  const [durationHours, setDurationHours] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState<'afterDays' | 'atEnd'>('atEnd');
  const [remindAfterDays, setRemindAfterDays] = useState<string>('7');
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; displayAmount: string; displayUnit: string }>>([]);
  // Advanced fields
  const [loadWeightBefore, setLoadWeightBefore] = useState<string>('');
  const [fillLevelPercent, setFillLevelPercent] = useState<string>('');
  const [waterLevel, setWaterLevel] = useState<string>('');
  const [waterAmountMl, setWaterAmountMl] = useState<string>('');

  // Complete Stage Modal State
  const [isCompleteStageOpen, setIsCompleteStageOpen] = useState(false);
  const [completeStageId, setCompleteStageId] = useState<string | null>(null);
  const [completeStageName, setCompleteStageName] = useState<string>('');
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
  const [loadWeightAfter, setLoadWeightAfter] = useState<string>('');

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
  const [editStageStartDateTime, setEditStageStartDateTime] = useState('');
  const [editStageDurationDays, setEditStageDurationDays] = useState('');
  const [editStageDurationHours, setEditStageDurationHours] = useState('');
  const [editStageNotes, setEditStageNotes] = useState('');

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
  const isAdvancedMode = settings?.trackingMode === 'Advanced';

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
    setStageStartDateTime('');
    setDurationDays('7');
    setDurationHours('0');
    setNotes('');
    setReminderEnabled(false);
    setReminderType('atEnd');
    setRemindAfterDays('7');
    setSelectedMaterials([]);
    setLoadWeightBefore('');
    setFillLevelPercent('');
    setWaterLevel('');
    setWaterAmountMl('');
  };

  const resetCompleteStageForm = () => {
    setCompleteStageId(null);
    setCompleteStageName('');
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
    setLoadWeightAfter('');
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
    const materialsToSubmit: CreateStageMaterialRequest[] = selectedMaterials
      .filter(m => m.materialId)
      .map(m => ({
        materialId: m.materialId,
        displayAmount: m.displayAmount ? parseFloat(m.displayAmount) : undefined,
        displayUnit: m.displayUnit || undefined,
      }));

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
      loadWeightBeforeGrams: loadWeightBefore ? parseFloat(loadWeightBefore) * 28.35 : undefined, // oz to grams
      fillLevelPercent: fillLevelPercent ? parseInt(fillLevelPercent) : undefined,
      waterLevel: waterLevel || undefined,
      waterAmountMl: waterAmountMl ? parseInt(waterAmountMl) : undefined,
      materials: materialsToSubmit.length > 0 ? materialsToSubmit : undefined,
    });
  };

  // Helper to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openAddStageModal = () => {
    resetAddStageForm();
    // First stage uses cycle start date, subsequent stages use "now"
    if (cycle && cycle.stageRuns.length === 0) {
      // First stage: use cycle's start date
      setStageStartDateTime(formatDateTimeLocal(new Date(cycle.startDate)));
    } else {
      // Subsequent stages: default to now
      setStageStartDateTime(formatDateTimeLocal(new Date()));
    }
    setIsAddStageOpen(true);
  };

  const openCompleteStageModal = (stage: StageRunSummaryDto) => {
    setCompleteStageId(stage.id);
    setCompleteStageName(stage.stageName);
    setIsCompleteStageOpen(true);
  };

  const handleCompleteStage = () => {
    if (!completeStageId) return;
    if (resultRating === 0) {
      toast.error('Please rate the stage result (1-5 stars)');
      return;
    }

    const data: CompleteStageRunRequest = {
      resultRating,
      nextAction,
      issueScratches: issueScratches || undefined,
      issueChips: issueChips || undefined,
      issueUnderRounded: issueUnderRounded || undefined,
      issueContamination: issueContamination || undefined,
      lessonsLearned: lessonsLearned || undefined,
      loadWeightAfterGrams: loadWeightAfter ? parseFloat(loadWeightAfter) * 28.35 : undefined,
    };

    // Include advanced quality if shown
    if (showAdvancedQuality || isAdvancedMode) {
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
      startDate: new Date(editCycleStartDate).toISOString(),
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
              {cycle.difficultyRating ? `${cycle.difficultyRating}/5` : 'Not rated'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Specimens</p>
            <p className="font-medium">{cycle.additionalSpecimens || 'Not specified'}</p>
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Stage</DialogTitle>
                  <DialogDescription>
                    Start a new tumbling stage for this cycle
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Stage Name */}
                  <div className="space-y-2">
                    <Label>Stage Name</Label>
                    <Select value={stageName} onValueChange={setStageName}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGE_NAMES.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {STAGE_NAMES.map(name => (
                        <Button
                          key={name}
                          type="button"
                          variant={stageName === name ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStageName(name)}
                        >
                          {name}
                        </Button>
                      ))}
                    </div>
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

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {DURATION_PRESETS.map(days => (
                        <Button
                          key={days}
                          type="button"
                          variant={durationDays === String(days) && durationHours === '0' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setDurationDays(String(days));
                            setDurationHours('0');
                          }}
                        >
                          {days}d
                        </Button>
                      ))}
                    </div>
                    {/* Calculated End Date */}
                    {stageStartDateTime && (parseInt(durationDays) > 0 || parseInt(durationHours) > 0) && (
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <span className="text-muted-foreground">End Date: </span>
                          <span className="font-medium">
                            {(() => {
                              const start = new Date(stageStartDateTime);
                              const days = parseInt(durationDays) || 0;
                              const hours = parseInt(durationHours) || 0;
                              const end = new Date(start.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
                              return end.toLocaleString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              });
                            })()}
                          </span>
                        </p>
                      </div>
                    )}
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
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
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
                      placeholder="Any notes about this stage..."
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

                  {/* Advanced Fields */}
                  {isAdvancedMode && (
                    <>
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Advanced Options</p>
                      </div>

                      {/* Load Weight */}
                      <div className="space-y-2">
                        <Label>Load Weight Before (oz)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g., 2.5"
                          value={loadWeightBefore}
                          onChange={(e) => setLoadWeightBefore(e.target.value)}
                        />
                      </div>

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

                      {/* Water Level */}
                      <div className="space-y-2">
                        <Label>Water Level</Label>
                        <RadioGroup value={waterLevel} onValueChange={setWaterLevel}>
                          <div className="flex flex-wrap gap-4">
                            {WATER_LEVELS.map(level => (
                              <div key={level.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={level.value} id={level.value} />
                                <Label htmlFor={level.value}>{level.label}</Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Water Amount */}
                      <div className="space-y-2">
                        <Label>Precise Water Amount (ml)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g., 250"
                          value={waterAmountMl}
                          onChange={(e) => setWaterAmountMl(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Barrel Selection */}
                  <div className="space-y-2">
                    <Label>Select Barrel(s)</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {allBarrels.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No active barrels available
                        </p>
                      ) : (
                        allBarrels.map(barrel => (
                          <div key={barrel.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={barrel.id}
                              checked={selectedBarrelIds.includes(barrel.id)}
                              onCheckedChange={() => toggleBarrel(barrel.id)}
                            />
                            <label
                              htmlFor={barrel.id}
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
                    <p className="text-xs text-muted-foreground">
                      {selectedBarrelIds.length > 0
                        ? `${selectedBarrelIds.length} barrel(s) selected`
                        : 'Select one or more barrels to run this stage'}
                    </p>
                  </div>
                </div>
                <DialogFooter>
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
            <DialogTitle>Complete Stage</DialogTitle>
            <DialogDescription>
              Mark &quot;{completeStageName}&quot; as complete
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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

            {/* Advanced Quality Ratings */}
            {(isAdvancedMode || showAdvancedQuality) && (
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
            )}

            {!isAdvancedMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedQuality(!showAdvancedQuality)}
                className="text-xs"
              >
                {showAdvancedQuality ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                {showAdvancedQuality ? 'Hide' : 'Show'} advanced quality ratings
              </Button>
            )}

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

            {/* Weight After - Advanced only */}
            {isAdvancedMode && (
              <div className="space-y-2">
                <Label>Weight After (oz)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 2.3"
                  value={loadWeightAfter}
                  onChange={(e) => setLoadWeightAfter(e.target.value)}
                />
              </div>
            )}

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
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>
              Adjust the stage duration. Use this if the stage finished earlier or later than planned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <Select value={editStageName} onValueChange={setEditStageName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_NAMES.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Days</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editStageDurationDays}
                    onChange={(e) => setEditStageDurationDays(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={editStageDurationHours}
                    onChange={(e) => setEditStageDurationHours(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {DURATION_PRESETS.map(days => (
                  <Button
                    key={days}
                    type="button"
                    variant={editStageDurationDays === String(days) && editStageDurationHours === '0' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setEditStageDurationDays(String(days));
                      setEditStageDurationHours('0');
                    }}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
              {/* Calculated End Date */}
              {editStageStartDateTime && (parseInt(editStageDurationDays) > 0 || parseInt(editStageDurationHours) > 0) && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="text-muted-foreground">End Date: </span>
                    <span className="font-medium">
                      {(() => {
                        const start = new Date(editStageStartDateTime);
                        const days = parseInt(editStageDurationDays) || 0;
                        const hours = parseInt(editStageDurationHours) || 0;
                        const end = new Date(start.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
                        return end.toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        });
                      })()}
                    </span>
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Tip: If the stage finished early (e.g., 3 days instead of 7), reduce the duration here before marking complete.
              </p>
            </div>
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

      {/* Photos */}
      <PhotoUploadPlaceholder
        title="Cycle Photos"
        description="Upload before, during, and after photos to track your progress"
      />
    </div>
  );
}

function StageCard({
  stage,
  onComplete,
  onEdit,
  onDelete,
  isCompleting,
}: {
  stage: StageRunSummaryDto;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  isCompleting?: boolean;
}) {
  const isActive = stage.status === 'Active';
  const startDate = new Date(stage.startDateTime);
  const endDate = new Date(stage.endDateTime);
  const now = new Date();
  const isOverdue = isActive && endDate < now;

  // Calculate progress
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progressPercent = isActive ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 100;

  const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
  const currentDay = Math.ceil(elapsed / (1000 * 60 * 60 * 24));

  const timeRemaining = isActive ? getTimeRemaining(endDate) : null;

  return (
    <Card className={isOverdue ? 'border-yellow-300' : ''}>
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
              <p className="font-medium">{stage.stageName}</p>
              <p className="text-sm text-muted-foreground">
                Started {startDate.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stage.resultRating && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {stage.resultRating}/5
              </Badge>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isActive && onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Duration
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      </CardContent>
    </Card>
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
