'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import type { BrowserStatsDto } from '@/types/admin';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

function MetricCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function PieChartCard({ title, data }: { title: string; data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function BarChartCard({ title, data }: { title: string; data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SessionTrendChart({ data }: { data: BrowserStatsDto['sessionTrend'] }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessions Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: d.sessionCount,
    users: d.uniqueUsers,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sessions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sessions" stroke="#0088FE" name="Sessions" />
            <Line type="monotone" dataKey="users" stroke="#00C49F" name="Unique Users" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['browserStats', days],
    queryFn: () => adminApi.getBrowserStats(days),
    staleTime: 5 * 60 * 1000, // 5 minute cache
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load analytics data</p>
        <p className="text-muted-foreground text-sm mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  const mobileCount = stats.deviceTypeBreakdown['Mobile'] || 0;
  const totalDevices = Object.values(stats.deviceTypeBreakdown).reduce((a, b) => a + b, 0);
  const mobilePercentage = totalDevices > 0 ? Math.round((mobileCount / totalDevices) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Session Analytics</h2>
        <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sessions"
          value={stats.totalSessions.toLocaleString()}
          subtitle={`${stats.uniqueUsers} unique users`}
        />
        <MetricCard
          title="WebP Support"
          value={`${stats.webPSupportPercentage}%`}
          subtitle={stats.usersOnOldBrowsers > 0 ? `${stats.usersOnOldBrowsers} on old browsers` : 'All browsers supported'}
        />
        <MetricCard
          title="Mobile Users"
          value={`${mobilePercentage}%`}
          subtitle={`${mobileCount} mobile sessions`}
        />
        <MetricCard
          title="Avg Session"
          value={`${stats.avgSessionDurationMinutes} min`}
          subtitle={`${stats.avgPageViewsPerSession} pages/session`}
        />
      </div>

      <Tabs defaultValue="browsers">
        <TabsList>
          <TabsTrigger value="browsers">Browsers</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="browsers" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartCard title="Browser Distribution" data={stats.browserBreakdown} />
            <BarChartCard title="Operating Systems" data={stats.osBreakdown} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="AVIF Support"
              value={`${stats.avifSupportPercentage}%`}
              subtitle="Next-gen image format support"
            />
            <MetricCard
              title="Users on Old Browsers"
              value={stats.usersOnOldBrowsers}
              subtitle="Safari < 14, IE, or Edge < 79"
            />
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartCard title="Device Types" data={stats.deviceTypeBreakdown} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.deviceTypeBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([device, count]) => {
                      const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
                      return (
                        <div key={device} className="flex items-center justify-between">
                          <span className="font-medium">{device}</span>
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-16 text-right">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartCard title="Countries" data={stats.countryBreakdown} />
            <BarChartCard title="Timezones" data={stats.timezoneBreakdown} />
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6 mt-6">
          <SessionTrendChart data={stats.sessionTrend} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Avg Session Duration"
              value={`${stats.avgSessionDurationMinutes} minutes`}
              subtitle="Time spent per session"
            />
            <MetricCard
              title="Avg Page Views"
              value={stats.avgPageViewsPerSession.toFixed(1)}
              subtitle="Pages viewed per session"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
