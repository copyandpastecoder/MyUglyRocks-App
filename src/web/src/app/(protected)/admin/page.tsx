'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  MessageSquare,
  Flag,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: `${stats?.activeUsers ?? 0} active`,
    },
    {
      title: 'Total Cycles',
      value: stats?.totalCycles ?? 0,
      icon: Activity,
    },
    {
      title: 'Total Posts',
      value: stats?.totalPosts ?? 0,
      icon: FileText,
      highlight: stats?.postsCreatedToday ? `+${stats.postsCreatedToday} today` : undefined,
    },
    {
      title: 'Total Comments',
      value: stats?.totalComments ?? 0,
      icon: MessageSquare,
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports ?? 0,
      icon: Flag,
      variant: (stats?.pendingReports ?? 0) > 0 ? 'destructive' : 'default',
      href: '/admin/moderation',
    },
    {
      title: 'New Users Today',
      value: stats?.usersRegisteredToday ?? 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className={stat.variant === 'destructive' && stat.value > 0 ? 'border-destructive' : ''}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              {stat.description && (
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              )}
              {stat.highlight && (
                <p className="text-xs text-green-600">{stat.highlight}</p>
              )}
              {stat.href && stat.value > 0 && (
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link href={stat.href}>View all</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/moderation">
              <Flag className="mr-2 h-4 w-4" />
              Review Reports
              {(stats?.pendingReports ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                  {stats?.pendingReports}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
