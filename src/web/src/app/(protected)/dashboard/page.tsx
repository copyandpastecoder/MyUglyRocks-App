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
import { DashboardSkeleton } from '@/components/skeletons';
import { CheckCircle2, Cylinder, RotateCcw, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { getCycleStatusClass } from '@/lib/cycle-utils';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { StatCard } from '@/components/ui/stat-card';

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
    <PageTransition>
      <div className="space-y-8">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/cycles/new">
                <Plus className="mr-2 h-4 w-4" />
                New Cycle
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tumblers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tumbler
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cycles">
                View All Cycles
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Active Cycles Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Active Cycles</CardTitle>
            <CardDescription>
              Your currently running cycles
            </CardDescription>
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
                      </p>
                    </div>
                    <RotateCcw className="h-4 w-4 text-muted-foreground" />
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
      </div>
    </PageTransition>
  );
}
