'use client';

import { useTumblers, useCycles } from '@/hooks';
import { useAuth } from '@/providers/auth-provider';
import { PAGE_CONTAINER_LOOSE } from '@/lib/layout';
import { DashboardSkeleton } from '@/components/skeletons';
import { StatCard } from '@/components/ui/stat-card';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { CheckCircle2, Cylinder, RotateCcw, Clock } from 'lucide-react';
import { DashboardStatistics } from '@/components/dashboard-statistics';

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

        {/* Cycle Statistics Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cycle Statistics</h2>
          <DashboardStatistics />
        </div>
      </div>
    </PageTransition>
  );
}
