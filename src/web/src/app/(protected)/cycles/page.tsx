'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCycles, useDeleteCycle } from '@/hooks';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FullPageSkeleton } from '@/components/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RotateCcw, MoreVertical, Pencil, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { getCycleStatusClass, getStageProgressText } from '@/lib/cycle-utils';
import type { CycleListDto } from '@/types/cycle';

const statusColors: Record<string, 'default' | 'secondary'> = {
  Active: 'default',
  Completed: 'secondary',
};

export default function CyclesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Active');

  // Active cycles: oldest first (ASC), Completed: newest first (DESC)
  const sortOrder = activeTab === 'Active' ? 'asc' : 'desc';
  const { data: cycles, isLoading } = useCycles(activeTab, sortOrder);
  const deleteMutation = useDeleteCycle();

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const renderCycleRow = (cycle: CycleListDto) => {
    const progressText = cycle.activeStageCount > 0 && cycle.activeStageStartDateTime && cycle.activeStageDurationEstimateEndDate
      ? getStageProgressText(
          new Date(cycle.activeStageStartDateTime),
          new Date(cycle.activeStageDurationEstimateEndDate),
          cycle.activeStageDaysOverdue
        )
      : null;

    return (
    <div
      key={cycle.cycleId}
      className={`flex items-center justify-between p-3 rounded-lg border hover:opacity-80 transition-colors ${activeTab === 'Active' ? getCycleStatusClass(cycle) : 'bg-card border-border'}`}
    >
      <Link href={`/cycles/${cycle.cycleId}`} className="flex-1 min-w-0">
        <p className="font-medium truncate">{cycle.name}</p>
        <p className="text-sm text-muted-foreground">
          {cycle.stageCount} stage{cycle.stageCount !== 1 ? 's' : ''}
          {progressText && (
            cycle.isOverdue ? (
              <span className="text-yellow-600"> · {progressText}</span>
            ) : (
              <span> · {progressText}</span>
            )
          )}
        </p>
      </Link>
      <div className="flex items-center gap-2">
        {cycle.isOverdue ? (
          <AlertCircle className="h-4 w-4 text-yellow-600" />
        ) : (
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.cycleId}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              View/Edit
            </DropdownMenuItem>
            {cycle.status === 'Active' && (
              <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.cycleId}/complete`)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Cycle
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={() => handleDelete(cycle.cycleId)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )};


  if (isLoading) {
    return <FullPageSkeleton withTabs cardCount={3} />;
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tumbling Cycles</h1>
          <p className="text-muted-foreground">Track your rock tumbling progress</p>
        </div>
        <Button asChild>
          <Link href="/cycles/new">
            <Plus className="mr-2 h-4 w-4" />
            New Cycle
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab} Cycles
              </CardTitle>
              <CardDescription>
                {activeTab === 'Active' && 'Your currently running cycles'}
                {activeTab === 'Completed' && 'Cycles that have been completed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cycles?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">
                    No {activeTab.toLowerCase()} cycles
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {activeTab === 'Active'
                      ? 'Start a new tumbling cycle to track your progress'
                      : `You don't have any ${activeTab.toLowerCase()} cycles yet`}
                  </p>
                  {activeTab === 'Active' && (
                    <Button asChild>
                      <Link href="/cycles/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Start New Cycle
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {cycles?.map(renderCycleRow)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cycle? All stage runs and photos
              will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
