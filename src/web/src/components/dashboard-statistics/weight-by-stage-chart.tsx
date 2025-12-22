'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale } from 'lucide-react';
import type { WeightStatsDto } from '@/types/cycle-statistics';

interface WeightByStageChartProps {
  stats: WeightStatsDto;
}

export function WeightByStageChart({ stats }: WeightByStageChartProps) {
  const hasData = stats.avgStage1WeightLossPercent !== null ||
    stats.avgStage2WeightLossPercent !== null ||
    stats.avgStage3WeightLossPercent !== null ||
    stats.avgStage4WeightLossPercent !== null;

  if (!hasData) {
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
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No weight data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Stage 1', value: stats.avgStage1WeightLossPercent ?? 0 },
    { name: 'Stage 2', value: stats.avgStage2WeightLossPercent ?? 0 },
    { name: 'Stage 3', value: stats.avgStage3WeightLossPercent ?? 0 },
    { name: 'Stage 4', value: stats.avgStage4WeightLossPercent ?? 0 },
  ];

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
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Weight Loss']}
              />
              <Bar dataKey="value" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
