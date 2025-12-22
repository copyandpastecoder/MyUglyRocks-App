'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import type { WeightStatsDto } from '@/types/cycle-statistics';

interface WeightStatsCardProps {
  stats: WeightStatsDto;
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

function formatWeight(grams: number | null): string {
  if (grams === null) return '—';
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${grams.toFixed(0)} g`;
}

export function WeightStatsCard({ stats }: WeightStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-green-500/10 p-2">
            <Scale className="h-4 w-4 text-green-500" />
          </div>
          <CardTitle className="text-base">Weight Loss by Stage</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-1 border-b">
            <span className="text-sm text-muted-foreground">Total Loss</span>
            <span className="font-semibold">{formatPercent(stats.avgTotalWeightLossPercent)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Stage 1</span>
              {stats.avgStage1Weight && (
                <span className="text-xs text-muted-foreground/70">
                  {formatWeight(stats.avgStage1Weight.avgWeightBeforeGrams)} → {formatWeight(stats.avgStage1Weight.avgWeightAfterGrams)}
                </span>
              )}
            </div>
            <span className="font-medium">{formatPercent(stats.avgStage1WeightLossPercent)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Stage 2</span>
              {stats.avgStage2Weight && (
                <span className="text-xs text-muted-foreground/70">
                  {formatWeight(stats.avgStage2Weight.avgWeightBeforeGrams)} → {formatWeight(stats.avgStage2Weight.avgWeightAfterGrams)}
                </span>
              )}
            </div>
            <span className="font-medium">{formatPercent(stats.avgStage2WeightLossPercent)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Stage 3</span>
              {stats.avgStage3Weight && (
                <span className="text-xs text-muted-foreground/70">
                  {formatWeight(stats.avgStage3Weight.avgWeightBeforeGrams)} → {formatWeight(stats.avgStage3Weight.avgWeightAfterGrams)}
                </span>
              )}
            </div>
            <span className="font-medium">{formatPercent(stats.avgStage3WeightLossPercent)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Stage 4</span>
              {stats.avgStage4Weight && (
                <span className="text-xs text-muted-foreground/70">
                  {formatWeight(stats.avgStage4Weight.avgWeightBeforeGrams)} → {formatWeight(stats.avgStage4Weight.avgWeightAfterGrams)}
                </span>
              )}
            </div>
            <span className="font-medium">{formatPercent(stats.avgStage4WeightLossPercent)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
