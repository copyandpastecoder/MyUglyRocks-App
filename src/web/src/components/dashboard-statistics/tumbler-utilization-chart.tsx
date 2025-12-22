'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import type { TumblerStatsDto } from '@/types/cycle-statistics';

interface TumblerUtilizationChartProps {
  stats: TumblerStatsDto[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(262 83% 58%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(200 98% 39%)',
];

export function TumblerUtilizationChart({ stats }: TumblerUtilizationChartProps) {
  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <PieChartIcon className="h-4 w-4 text-purple-500" />
            </div>
            <CardTitle className="text-base">Tumbler Utilization</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No tumbler data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.map((tumbler) => ({
    name: tumbler.tumblerName,
    value: tumbler.cycleCount,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <PieChartIcon className="h-4 w-4 text-purple-500" />
          </div>
          <CardTitle className="text-base">Tumbler Utilization</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value} cycles`, 'Count']}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
