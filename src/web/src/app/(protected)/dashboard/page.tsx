'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTumblers, useCycles, useDeleteCycle } from '@/hooks';
import { useAuth } from '@/providers/auth-provider';
import { PAGE_CONTAINER_LOOSE } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { DashboardSkeleton } from '@/components/skeletons';
import { StatCard } from '@/components/ui/stat-card';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { CheckCircle2, Cylinder, RotateCcw, Clock, Plus, AlertCircle, MoreVertical, Pencil, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getCycleStatusClass, getStageProgressText } from '@/lib/cycle-utils';
import type { CycleListDto } from '@/types/cycle';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tumblers, isLoading: tumblersLoading } = useTumblers();
  const { data: activeCycles, isLoading: activeCyclesLoading } = useCycles('Active', 'asc');
  const { data: completedCycles, isLoading: completedCyclesLoading } = useCycles('Completed', 'desc');
  const deleteMutation = useDeleteCycle();

  const isLoading = tumblersLoading || activeCyclesLoading || completedCyclesLoading;

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const formatTumblerBarrel = (cycle: CycleListDto) => {
    if (!cycle.activeTumblerName) return null;

    const barrelPart = cycle.activeBarrelNumber != null
      ? cycle.activeBarrelNickname
        ? `#${cycle.activeBarrelNumber} ${cycle.activeBarrelNickname}`
        : `#${cycle.activeBarrelNumber}`
      : cycle.activeBarrelNickname || null;

    return barrelPart
      ? `${cycle.activeTumblerName} · ${barrelPart}`
      : cycle.activeTumblerName;
  };

  const renderCycleRow = (cycle: CycleListDto) => {
    const progressText = cycle.activeStageCount > 0 && cycle.activeStageStartDateTime && cycle.activeStageDurationEstimateEndDate
      ? getStageProgressText(
          new Date(cycle.activeStageStartDateTime),
          new Date(cycle.activeStageDurationEstimateEndDate),
          cycle.activeStageDaysOverdue
        )
      : null;

    const tumblerBarrelText = formatTumblerBarrel(cycle);

    return (
      <div
        key={cycle.cycleId}
        className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 ${getCycleStatusClass(cycle)}`}
      >
        <Link href={`/cycles/${cycle.cycleId}`} className="flex-1 min-w-0">
          <p className="font-medium truncate">{cycle.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {cycle.stageCount} stage{cycle.stageCount !== 1 ? 's' : ''}
            {progressText && (
              cycle.isOverdue ? (
                <span className="text-yellow-600"> · {progressText}</span>
              ) : (
                <span> · {progressText}</span>
              )
            )}
            {tumblerBarrelText && (
              <span className="text-muted-foreground/70"> · {tumblerBarrelText}</span>
            )}
          </p>
        </Link>
        <div className="flex items-center gap-2">
          {cycle.isOverdue ? (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          ) : (
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          )}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.cycleId}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                View/Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.cycleId}/complete`)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Cycle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onSelect={() => handleDelete(cycle.cycleId)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const tumblerCount = tumblers?.length ?? 0;
  const activeCycleCount = activeCycles?.length ?? 0;
  const completedCycleCount = completedCycles?.length ?? 0;

  // Calculate active stages
  const activeStageCount = activeCycles?.reduce((acc, cycle) => acc + cycle.activeStageCount, 0) ?? 0;

  return (
    <PageTransition>
      <div className={PAGE_CONTAINER_LOOSE}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading">
            Welcome back, {user?.displayName || user?.username}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your rock tumbling journey
          </p>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StaggerItem>
            <StatCard
              title="Active Cycles"
              value={activeCycleCount}
              subtitle={`${activeStageCount} active stage${activeStageCount !== 1 ? 's' : ''}`}
              icon={RotateCcw}
              gradient="blue"
            />
          </StaggerItem>

          <StaggerItem>
            <StatCard
              title="Completed Cycles"
              value={completedCycleCount}
              subtitle="All time"
              icon={CheckCircle2}
              gradient="green"
            />
          </StaggerItem>

          <StaggerItem>
            <StatCard
              title="My Tumblers"
              value={tumblerCount}
              subtitle="Registered machines"
              icon={Cylinder}
              gradient="purple"
            />
          </StaggerItem>

          <StaggerItem>
            <StatCard
              title="Active Stages"
              value={activeStageCount}
              subtitle="Currently running"
              icon={Clock}
              gradient="amber"
            />
          </StaggerItem>
        </StaggerContainer>

      {/* Active Cycles Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Cycles</CardTitle>
            <CardDescription>
              Your currently running cycles
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/cycles/new">
              <Plus className="mr-2 h-4 w-4" />
              New Cycle
            </Link>
          </Button>
        </CardHeader>
          <CardContent>
            {activeCycles && activeCycles.length > 0 ? (
              <div className="space-y-2">
                {activeCycles.slice(0, 6).map(cycle => renderCycleRow(cycle))}
                {activeCycles.length > 6 && (
                  <Link
                    href="/cycles"
                    className="block text-center text-sm text-primary hover:underline pt-2"
                  >
                    View all {activeCycles.length} active cycles
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-3">No active cycles</p>
                <Button asChild size="sm">
                  <Link href="/cycles/new">Start a Cycle</Link>
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cycle? All stage runs and photos
              will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageTransition>
  );
}
