'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDot } from 'lucide-react';
import type { BarrelStatsDto } from '@/types/cycle-statistics';

interface BarrelStatsCardProps {
  stats: BarrelStatsDto[];
}

function formatHours(hours: number): string {
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k`;
  return `${hours.toFixed(0)}`;
}

export function BarrelStatsCard({ stats }: BarrelStatsCardProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <CircleDot className="h-4 w-4 text-cyan-500" />
          </div>
          <CardTitle className="text-base">Barrel Usage</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Barrel</TableHead>
              <TableHead>Tumbler</TableHead>
              <TableHead className="text-right">Cycles</TableHead>
              <TableHead className="text-right pr-6">Total Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((barrel) => (
              <TableRow key={barrel.barrelId}>
                <TableCell className="pl-6 font-medium">{barrel.barrelName}</TableCell>
                <TableCell className="text-muted-foreground">{barrel.tumblerName}</TableCell>
                <TableCell className="text-right">{barrel.cycleCount}</TableCell>
                <TableCell className="text-right pr-6">{formatHours(barrel.totalHours)} hrs</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
