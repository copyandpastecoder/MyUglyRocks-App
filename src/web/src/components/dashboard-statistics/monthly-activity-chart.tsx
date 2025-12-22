'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import type { MonthlyActivityDto } from '@/types/cycle-statistics';

interface MonthlyActivityChartProps {
  data: MonthlyActivityDto[];
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthlyActivityChart({ data }: MonthlyActivityChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-base">Monthly Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No activity data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take last 12 months
  const chartData = data.slice(-12).map((item) => {
    const monthIndex = (item.month ?? 1) - 1;
    const monthLabel = monthNames[monthIndex] ?? 'Unknown';

    return {
      name: `${monthLabel} ${item.year.toString().slice(-2)}`,
      started: item.cyclesStarted,
      completed: item.cyclesCompleted,
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-base">Monthly Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="started" name="Started" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
