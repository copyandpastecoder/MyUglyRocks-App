'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { ActivityStatsDto } from '@/types/cycle-statistics';

interface ActivityStatsCardProps {
  stats: ActivityStatsDto;
}

export function ActivityStatsCard({ stats }: ActivityStatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <CardTitle className="text-base">Activity Patterns</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Max Concurrent</span>
            <span className="font-semibold">{stats.maxConcurrentCycles}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Concurrent</span>
            <span className="font-medium">{stats.avgConcurrentCycles.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
