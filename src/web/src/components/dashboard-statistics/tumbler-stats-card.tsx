'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Cog } from 'lucide-react';
import type { TumblerStatsDto } from '@/types/cycle-statistics';

interface TumblerStatsCardProps {
  stats: TumblerStatsDto[];
}

function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  return `${hours.toFixed(0)} hrs`;
}

function formatDays(days: number | null): string {
  if (days === null) return '—';
  return `${days.toFixed(1)} days`;
}

export function TumblerStatsCard({ stats }: TumblerStatsCardProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <Cog className="h-4 w-4 text-purple-500" />
          </div>
          <CardTitle className="text-base">Tumbler Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Tumbler</TableHead>
              <TableHead className="text-right">Cycles</TableHead>
              <TableHead className="text-right">Avg Hours</TableHead>
              <TableHead className="text-right pr-6">Idle Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((tumbler) => (
              <TableRow key={tumbler.tumblerId}>
                <TableCell className="pl-6 font-medium">{tumbler.tumblerName}</TableCell>
                <TableCell className="text-right">{tumbler.cycleCount}</TableCell>
                <TableCell className="text-right">{formatHours(tumbler.avgCycleHours)}</TableCell>
                <TableCell className="text-right pr-6">{formatDays(tumbler.avgIdleTimeDays)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
