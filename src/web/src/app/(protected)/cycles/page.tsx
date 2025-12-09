'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCycles, useDeleteCycle, useArchiveCycle } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FullPageSkeleton } from '@/components/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RotateCcw, MoreVertical, Pencil, Trash2, CheckCircle, Archive, AlertCircle } from 'lucide-react';
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
import { getCycleStatusClass } from '@/lib/cycle-utils';
import type { CycleListDto } from '@/types/cycle';

const statusColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  Active: 'default',
  Completed: 'secondary',
  Archived: 'outline',
};

export default function CyclesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Active');

  // Active cycles: oldest first (ASC), Completed/Archived: newest first (DESC)
  const sortOrder = activeTab === 'Active' ? 'asc' : 'desc';
  const { data: cycles, isLoading } = useCycles(activeTab, sortOrder);
  const deleteMutation = useDeleteCycle();
  const archiveMutation = useArchiveCycle();

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

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
  };

  const renderCycleCard = (cycle: CycleListDto) => (
    <Link key={cycle.id} href={`/cycles/${cycle.id}`} className="block">
      <Card className={`relative hover:shadow-md transition-shadow cursor-pointer ${activeTab === 'Active' ? getCycleStatusClass(cycle) : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{cycle.name}</CardTitle>
              <CardDescription>
                Started {new Date(cycle.startDate).toLocaleDateString()}
                {cycle.endDate && ` • Ended ${new Date(cycle.endDate).toLocaleDateString()}`}
              </CardDescription>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.id}`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    View/Edit
                  </DropdownMenuItem>
                  {cycle.status === 'Active' && (
                    <DropdownMenuItem onSelect={() => router.push(`/cycles/${cycle.id}/complete`)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Cycle
                    </DropdownMenuItem>
                  )}
                  {cycle.status === 'Completed' && (
                    <DropdownMenuItem onSelect={() => handleArchive(cycle.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={() => handleDelete(cycle.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={statusColors[cycle.status] || 'default'}>
            {cycle.status}
          </Badge>
          <Badge variant="outline">
            {cycle.stageCount} stage{cycle.stageCount !== 1 ? 's' : ''}
          </Badge>
          {cycle.activeStageCount > 0 && (
            <Badge variant="secondary">
              {cycle.activeStageCount} active
            </Badge>
          )}
          {cycle.isOverdue && (
            <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
              <AlertCircle className="mr-1 h-3 w-3" />
              Overdue
            </Badge>
          )}
          {cycle.difficultyRating && (
            <Badge variant="outline">
              Difficulty: {cycle.difficultyRating}/5
            </Badge>
          )}
        </div>
        {cycle.goal && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cycle.goal}
          </p>
        )}
        {cycle.stageCount === 0 && cycle.status === 'Active' && (
          <Button
            className="mt-3"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/cycles/${cycle.id}?addStage=true`);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Stage
          </Button>
        )}
      </CardContent>
      </Card>
    </Link>
  );

  if (isLoading) {
    return <FullPageSkeleton withTabs cardCount={3} />;
  }

  return (
    <div className="space-y-6">
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
          <TabsTrigger value="Archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {cycles?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
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
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cycles?.map(renderCycleCard)}
            </div>
          )}
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
