'use client';

import { useState } from 'react';
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
import { CheckCircle2, Cylinder, RotateCcw, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { CycleCard } from '@/components/cycle-card';

export default function DashboardPage() {
  const { user } = useAuth();
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
                {activeCycles.slice(0, 6).map(cycle => (
                  <CycleCard
                    key={cycle.cycleId}
                    cycle={cycle}
                    onDelete={handleDelete}
                  />
                ))}
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
