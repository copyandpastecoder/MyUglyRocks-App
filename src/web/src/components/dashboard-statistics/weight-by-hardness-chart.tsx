'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Hammer } from 'lucide-react';
import type { HardnessWeightLossDto } from '@/types/cycle-statistics';

interface WeightByHardnessChartProps {
  data: HardnessWeightLossDto[];
}

export function WeightByHardnessChart({ data }: WeightByHardnessChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Hammer className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-base">Weight Loss by Hardness</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No hardness data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.hardnessCategory,
    value: item.avgWeightLossPercent ?? 0,
    count: item.cycleCount,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <Hammer className="h-4 w-4 text-amber-500" />
          </div>
          <CardTitle className="text-base">Weight Loss by Hardness</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, _, props) => [
                  `${(value as number).toFixed(1)}% (${props.payload.count} cycles)`,
                  'Avg Loss',
                ]}
              />
              <Bar dataKey="value" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
