'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi, tumblerApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { PhotoUploadPlaceholder } from '@/components/photo-upload-placeholder';
import type { StageRunSummaryDto } from '@/types/cycle';
import type { BarrelDto } from '@/types/tumbler';

const STAGE_NAMES = ['Coarse', 'Medium', 'Fine', 'Pre-Polish', 'Polish', 'Burnish'];

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cycleId = params.id as string;

  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [selectedBarrelIds, setSelectedBarrelIds] = useState<string[]>([]);
  const [stageName, setStageName] = useState<string>('Coarse');
  const [durationDays, setDurationDays] = useState<string>('7');
  const [durationHours, setDurationHours] = useState<string>('0');
  const [waterAmountMl, setWaterAmountMl] = useState<string>('');

  const { data: cycle, isLoading: cycleLoading } = useQuery({
    queryKey: ['cycle', cycleId],
    queryFn: () => cycleApi.getById(cycleId),
  });

  const { data: tumblers } = useQuery({
    queryKey: ['tumblers', 'withBarrels'],
    queryFn: tumblerApi.getAllWithBarrels,
  });

  const addStageMutation = useMutation({
    mutationFn: (data: { barrelIds: string[]; stageName: string; durationDays: number; durationHours: number; waterAmountMl?: number }) =>
      cycleApi.addStageRun(cycleId, {
        barrelIds: data.barrelIds,
        stageName: data.stageName,
        startDateTime: new Date().toISOString(),
        durationDays: data.durationDays,
        durationHours: data.durationHours,
        waterAmountMl: data.waterAmountMl,
        reminderEnabled: true,
        remindAtEndOfStage: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      toast.success('Stage added successfully');
      setIsAddStageOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to add stage');
    },
  });

  const deleteStageRunMutation = useMutation({
    mutationFn: cycleApi.deleteStageRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      toast.success('Stage deleted');
    },
    onError: () => {
      toast.error('Failed to delete stage');
    },
  });

  const completeStageMutation = useMutation({
    mutationFn: (id: string) => cycleApi.completeStageRun(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
      toast.success('Stage completed');
    },
    onError: () => {
      toast.error('Failed to complete stage');
    },
  });

  const resetForm = () => {
    setSelectedBarrelIds([]);
    setStageName('Coarse');
    setDurationDays('7');
    setDurationHours('0');
    setWaterAmountMl('');
  };

  const handleAddStage = () => {
    if (selectedBarrelIds.length === 0) {
      toast.error('Please select at least one barrel');
      return;
    }
    addStageMutation.mutate({
      barrelIds: selectedBarrelIds,
      stageName,
      durationDays: parseInt(durationDays) || 0,
      durationHours: parseInt(durationHours) || 0,
      waterAmountMl: waterAmountMl ? parseInt(waterAmountMl) : undefined,
    });
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
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stage
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Stage</DialogTitle>
                  <DialogDescription>
                    Start a new tumbling stage for this cycle
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (Days)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (Hours)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Water Amount (ml)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g., 500"
                      value={waterAmountMl}
                      onChange={(e) => setWaterAmountMl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: precise water measurement in milliliters
                    </p>
                  </div>
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
                <Button onClick={() => setIsAddStageOpen(true)}>
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
                    onComplete={() => completeStageMutation.mutate(stage.id)}
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
  onDelete,
  isCompleting,
}: {
  stage: StageRunSummaryDto;
  onComplete?: () => void;
  onDelete: () => void;
  isCompleting?: boolean;
}) {
  const isActive = stage.status === 'Active';
  const endDate = new Date(stage.endDateTime);
  const isOverdue = isActive && endDate < new Date();
  const timeRemaining = isActive ? getTimeRemaining(endDate) : null;

  return (
    <Card className={isOverdue ? 'border-yellow-300' : ''}>
      <CardContent className="flex items-center justify-between py-4">
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
              {isActive ? (
                isOverdue ? (
                  <span className="text-yellow-600">Overdue</span>
                ) : (
                  `${timeRemaining} remaining`
                )
              ) : (
                `Completed ${new Date(stage.endDateTime).toLocaleDateString()}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stage.resultRating && (
            <Badge variant="outline">{stage.resultRating}/5</Badge>
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
