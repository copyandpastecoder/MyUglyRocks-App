'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { DurationStatsDto } from '@/types/cycle-statistics';

interface DurationStatsCardProps {
  stats: DurationStatsDto;
}

function formatDays(days: number | null): string {
  if (days === null) return '—';
  if (days < 7) return `${days.toFixed(1)} days`;
  const weeks = days / 7;
  return `${weeks.toFixed(1)} weeks`;
}

export function DurationStatsCard({ stats }: DurationStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-base">Duration Averages</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-1 border-b">
            <span className="text-sm text-muted-foreground">Total Cycle</span>
            <span className="font-semibold">{formatDays(stats.avgCycleDurationDays)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-muted-foreground">Stage 1 (Coarse)</span>
            <span className="font-medium">{formatDays(stats.avgStage1DurationDays)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-muted-foreground">Stage 2 (Medium)</span>
            <span className="font-medium">{formatDays(stats.avgStage2DurationDays)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-muted-foreground">Stage 3 (Fine)</span>
            <span className="font-medium">{formatDays(stats.avgStage3DurationDays)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-muted-foreground">Stage 4 (Polish)</span>
            <span className="font-medium">{formatDays(stats.avgStage4DurationDays)}</span>
          </div>
          {stats.fastestCycleDays !== null && stats.longestCycleDays !== null && (
            <div className="pt-2 mt-2 border-t text-xs text-muted-foreground flex justify-between">
              <span>Fastest: {formatDays(stats.fastestCycleDays)}</span>
              <span>Longest: {formatDays(stats.longestCycleDays)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
