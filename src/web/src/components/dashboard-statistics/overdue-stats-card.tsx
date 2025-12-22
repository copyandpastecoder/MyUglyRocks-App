'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { OverdueStatsDto } from '@/types/cycle-statistics';

interface OverdueStatsCardProps {
  stats: OverdueStatsDto;
}

export function OverdueStatsCard({ stats }: OverdueStatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-orange-500/10 p-2">
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <CardTitle className="text-base">Overdue Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">On-Time Rate</span>
            <span className="font-semibold">{stats.onTimeCompletionRate.toFixed(0)}%</span>
          </div>
          {stats.mostOverdueStageType && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Most Late</span>
              <span className="font-medium">{stats.mostOverdueStageType}</span>
            </div>
          )}
          {stats.avgDaysOverEstimate !== null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Days Over</span>
              <span className="font-medium">{stats.avgDaysOverEstimate.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
