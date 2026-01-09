'use client';

import { useState, useEffect } from 'react';
import { useCycleStatistics } from '@/hooks/use-cycle-statistics';
import { Skeleton } from '@/components/ui/skeleton';
import { DurationStatsCard } from './duration-stats-card';
import { WeightStatsCard } from './weight-stats-card';
import { TumblerStatsCard } from './tumbler-stats-card';
import { OperationalStatsCard } from './operational-stats-card';
import { SpecimenStatsCard } from './specimen-stats-card';
import { BarrelStatsCard } from './barrel-stats-card';
import { OverdueStatsCard } from './overdue-stats-card';
import { ActivityStatsCard } from './activity-stats-card';
import { MonthlyActivityChart } from './monthly-activity-chart';
import { TumblerUtilizationChart } from './tumbler-utilization-chart';
import { WeightByStageChart } from './weight-by-stage-chart';
import { WeightByHardnessChart } from './weight-by-hardness-chart';
import { StageDurationChart } from './stage-duration-chart';

export function DashboardStatistics() {
  const { data: statistics, isLoading, error } = useCycleStatistics();
  const [chartsReady, setChartsReady] = useState(false);

  // Ensure charts render after layout is complete to prevent Recharts dimension warnings
  useEffect(() => {
    if (!isLoading && statistics) {
      // Delay to ensure grid layout has calculated dimensions before rendering charts
      const timer = setTimeout(() => setChartsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, statistics]);

  if (isLoading || !chartsReady) {
    return <DashboardStatisticsSkeleton />;
  }

  if (error || !statistics) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">Unable to load statistics</p>
        <p className="text-sm mt-1">
          Please try refreshing the page. If the problem persists, contact support.
        </p>
      </div>
    );
  }

  // Check if user has any data
  const hasData = statistics.operationalStats.totalRuntimeHours > 0 ||
    statistics.activityStats.cyclesPerMonth.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No cycle data yet</p>
        <p className="text-sm mt-1">Start a cycle to see your statistics here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Duration and Weight Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <DurationStatsCard stats={statistics.durationStats} />
        <WeightStatsCard stats={statistics.weightStats} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyActivityChart data={statistics.activityStats.cyclesPerMonth} />
        <StageDurationChart
          overallStats={statistics.durationStats}
          tumblerStats={statistics.durationStats.perTumblerDurations}
        />
      </div>

      {/* Weight Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <WeightByStageChart stats={statistics.weightStats} />
        <WeightByHardnessChart data={statistics.weightStats.weightLossByHardness} />
      </div>

      {/* Tumbler Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <TumblerStatsCard stats={statistics.tumblerStats} />
        <TumblerUtilizationChart stats={statistics.tumblerStats} />
      </div>

      {/* Barrel Stats */}
      {statistics.barrelStats.length > 0 && (
        <BarrelStatsCard stats={statistics.barrelStats} />
      )}

      {/* Bottom Row - Smaller Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <OperationalStatsCard stats={statistics.operationalStats} />
        <SpecimenStatsCard stats={statistics.specimenStats} />
        <div className="space-y-4">
          <OverdueStatsCard stats={statistics.overdueStats} />
          <ActivityStatsCard stats={statistics.activityStats} />
        </div>
      </div>
    </div>
  );
}

function DashboardStatisticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-[150px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
      </div>
    </div>
  );
}

export { DurationStatsCard } from './duration-stats-card';
export { WeightStatsCard } from './weight-stats-card';
export { TumblerStatsCard } from './tumbler-stats-card';
export { OperationalStatsCard } from './operational-stats-card';
export { SpecimenStatsCard } from './specimen-stats-card';
export { BarrelStatsCard } from './barrel-stats-card';
export { OverdueStatsCard } from './overdue-stats-card';
export { ActivityStatsCard } from './activity-stats-card';
