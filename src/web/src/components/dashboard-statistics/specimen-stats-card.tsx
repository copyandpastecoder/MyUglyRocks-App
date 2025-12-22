'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Gem } from 'lucide-react';
import type { SpecimenStatsDto } from '@/types/cycle-statistics';

interface SpecimenStatsCardProps {
  stats: SpecimenStatsDto;
}

export function SpecimenStatsCard({ stats }: SpecimenStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-rose-500/10 p-2">
            <Gem className="h-4 w-4 text-rose-500" />
          </div>
          <CardTitle className="text-base">Specimen Stats</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg per Cycle</span>
            <span className="font-semibold">
              {stats.avgSpecimensPerCycle !== null
                ? stats.avgSpecimensPerCycle.toFixed(1)
                : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Processed</span>
            <span className="font-medium">{stats.totalSpecimensProcessed}</span>
          </div>
          {stats.mostCommonTypes.length > 0 && (
            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground">Top Types</span>
              <div className="mt-1 space-y-1">
                {stats.mostCommonTypes.slice(0, 3).map((type) => (
                  <div key={type.rockType} className="flex justify-between text-sm">
                    <span className="truncate max-w-[120px]">{type.rockType}</span>
                    <span className="text-muted-foreground">({type.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
