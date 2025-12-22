'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock } from 'lucide-react';
import type { DurationStatsDto, TumblerDurationStatsDto } from '@/types/cycle-statistics';

interface StageDurationChartProps {
  overallStats: DurationStatsDto;
  tumblerStats: TumblerDurationStatsDto[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(262 83% 58%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(200 98% 39%)',
];

function daysToWeeks(days: number | null): number {
  if (days === null) return 0;
  return days / 7;
}

export function StageDurationChart({ overallStats, tumblerStats }: StageDurationChartProps) {
  const hasData = overallStats.avgStage1DurationDays !== null ||
    overallStats.avgStage2DurationDays !== null ||
    overallStats.avgStage3DurationDays !== null ||
    overallStats.avgStage4DurationDays !== null;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-base">Stage Duration by Tumbler</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No duration data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have tumbler data, show comparison
  if (tumblerStats.length > 1) {
    const chartData = [
      {
        stage: 'Stage 1',
        ...Object.fromEntries(
          tumblerStats.map((t) => [t.tumblerName, daysToWeeks(t.avgStage1DurationDays)])
        ),
      },
      {
        stage: 'Stage 2',
        ...Object.fromEntries(
          tumblerStats.map((t) => [t.tumblerName, daysToWeeks(t.avgStage2DurationDays)])
        ),
      },
      {
        stage: 'Stage 3',
        ...Object.fromEntries(
          tumblerStats.map((t) => [t.tumblerName, daysToWeeks(t.avgStage3DurationDays)])
        ),
      },
      {
        stage: 'Stage 4',
        ...Object.fromEntries(
          tumblerStats.map((t) => [t.tumblerName, daysToWeeks(t.avgStage4DurationDays)])
        ),
      },
    ];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-base">Stage Duration by Tumbler</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}w`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} weeks`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {tumblerStats.map((tumbler, index) => (
                  <Bar
                    key={tumbler.tumblerId}
                    dataKey={tumbler.tumblerName}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single tumbler or overall view
  const chartData = [
    { stage: 'Stage 1', weeks: daysToWeeks(overallStats.avgStage1DurationDays) },
    { stage: 'Stage 2', weeks: daysToWeeks(overallStats.avgStage2DurationDays) },
    { stage: 'Stage 3', weeks: daysToWeeks(overallStats.avgStage3DurationDays) },
    { stage: 'Stage 4', weeks: daysToWeeks(overallStats.avgStage4DurationDays) },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-base">Stage Duration</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}w`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)} weeks`, 'Duration']}
              />
              <Bar dataKey="weeks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
