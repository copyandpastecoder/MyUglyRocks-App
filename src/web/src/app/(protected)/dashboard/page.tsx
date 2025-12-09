'use client';

import { useTumblers, useCycles } from '@/hooks';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardSkeleton } from '@/components/skeletons';
import { CheckCircle2, Cylinder, RotateCcw, Clock, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getCycleStatusClass } from '@/lib/cycle-utils';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: tumblers, isLoading: tumblersLoading } = useTumblers();
  const { data: activeCycles, isLoading: activeCyclesLoading } = useCycles('Active', 'asc');
  const { data: completedCycles, isLoading: completedCyclesLoading } = useCycles('Completed', 'desc');

  const isLoading = tumblersLoading || activeCyclesLoading || completedCyclesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const tumblerCount = tumblers?.length ?? 0;
  const activeCycleCount = activeCycles?.length ?? 0;
  const completedCycleCount = completedCycles?.length ?? 0;

  // Calculate active stages
  const activeStageCount = activeCycles?.reduce((acc, cycle) => acc + cycle.activeStageCount, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-heading">
          Welcome back, {user?.displayName || user?.username}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your rock tumbling journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cycles</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeCycleCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeStageCount} active stage{activeStageCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Cycles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedCycleCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Tumblers</CardTitle>
            <Cylinder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tumblerCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Registered machines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Stages</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeStageCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

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
              Add Cycle
            </Link>
          </Button>
        </CardHeader>
          <CardContent>
            {activeCycles && activeCycles.length > 0 ? (
              <div className="space-y-2">
                {activeCycles.slice(0, 6).map(cycle => (
                  <Link
                    key={cycle.id}
                    href={`/cycles/${cycle.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg border hover:opacity-80 transition-colors ${getCycleStatusClass(cycle)}`}
                  >
                    <div>
                      <p className="font-medium">{cycle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cycle.activeStageCount} active stage{cycle.activeStageCount !== 1 ? 's' : ''}
                        {cycle.isOverdue && (
                          <span className="text-yellow-600 ml-2">
                            · overdue
                          </span>
                        )}
                      </p>
                    </div>
                    {cycle.isOverdue ? (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Link>
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
    </div>
  );
}
