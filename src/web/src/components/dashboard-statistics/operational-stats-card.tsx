'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, AlertTriangle } from 'lucide-react';
import type { OperationalStatsDto } from '@/types/cycle-statistics';

interface OperationalStatsCardProps {
  stats: OperationalStatsDto;
}

function formatHours(hours: number): string {
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k hrs`;
  return `${hours.toFixed(0)} hrs`;
}

export function OperationalStatsCard({ stats }: OperationalStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <CardTitle className="text-base">Operational Stats</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Runtime</span>
            <span className="font-semibold">{formatHours(stats.totalRuntimeHours)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg per Cycle</span>
            <span className="font-medium">
              {stats.avgRuntimePerCycleHours !== null
                ? `${stats.avgRuntimePerCycleHours.toFixed(0)} hrs`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Completion Rate</span>
            <span className="font-medium">{stats.completionRate.toFixed(0)}%</span>
          </div>
          {stats.currentlyOverdueCount > 0 && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </span>
              <span className="font-medium text-amber-500">{stats.currentlyOverdueCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
