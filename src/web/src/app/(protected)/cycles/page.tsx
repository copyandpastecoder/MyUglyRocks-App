'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCycles, useDeleteCycle, useCycle } from '@/hooks';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { FullPageSkeleton } from '@/components/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { NoCyclesEmpty } from '@/components/ui/empty-state';
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
import { CycleFormDialog } from '@/components/cycle-form-dialog';
import type { CycleListDto } from '@/types/cycle';

export default function CyclesPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Active');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);

  // Active cycles: oldest first (ASC), Completed: newest first (DESC)
  const sortOrder = activeTab === 'Active' ? 'asc' : 'desc';
  const { data: cycles, isLoading, refetch } = useCycles(activeTab, sortOrder);
  const deleteMutation = useDeleteCycle();

  // Fetch full cycle details when editing
  const { data: editingCycle } = useCycle(editingCycleId);

  const handleEdit = (cycleId: string) => {
    setEditingCycleId(cycleId);
    setFormDialogOpen(true);
  };

  const handleNewCycle = () => {
    setEditingCycleId(null);
    setFormDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingCycleId(null);
    }
  };

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

  const formatTumblerBarrel = (cycle: CycleListDto) => {
    if (!cycle.activeTumblerName) return null;

    const barrelPart = cycle.activeBarrelNumber != null
      ? cycle.activeBarrelNickname
        ? `#${cycle.activeBarrelNumber} ${cycle.activeBarrelNickname}`
        : `#${cycle.activeBarrelNumber}`
      : cycle.activeBarrelNickname || null;

    return barrelPart
      ? `${cycle.activeTumblerName} · ${barrelPart}`
      : cycle.activeTumblerName;
  };

  const renderCycleRow = (cycle: CycleListDto) => {
    const progressText = cycle.activeStageCount > 0 && cycle.activeStageStartDateTime && cycle.activeStageDurationEstimateEndDate
      ? getStageProgressText(
          new Date(cycle.activeStageStartDateTime),
          new Date(cycle.activeStageDurationEstimateEndDate),
          cycle.activeStageDaysOverdue
        )
      : null;

    const tumblerBarrelText = formatTumblerBarrel(cycle);

    return (
    <div
      key={cycle.cycleId}
      className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 ${activeTab === 'Active' ? getCycleStatusClass(cycle) : 'bg-card border-border hover:bg-accent/50'}`}
    >
      <Link href={`/cycles/${cycle.cycleId}`} className="flex-1 min-w-0">
        <p className="font-medium truncate">{cycle.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {cycle.stageCount} stage{cycle.stageCount !== 1 ? 's' : ''}
          {progressText && (
            cycle.isOverdue ? (
              <span className="text-yellow-600"> · {progressText}</span>
            ) : (
              <span> · {progressText}</span>
            )
          )}
          {tumblerBarrelText && (
            <span className="text-muted-foreground/70"> · {tumblerBarrelText}</span>
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
              <RotateCcw className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleEdit(cycle.cycleId)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
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
    <PageTransition>
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tumbling Cycles</h1>
            <p className="text-muted-foreground">Track your rock tumbling progress</p>
          </div>
          <Button onClick={handleNewCycle}>
            <Plus className="mr-2 h-4 w-4" />
            New Cycle
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {cycles?.length === 0 ? (
              <div className="border rounded-lg border-dashed py-4">
                <NoCyclesEmpty
                  onAction={activeTab === 'Active' ? handleNewCycle : undefined}
                />
              </div>
            ) : (
              <StaggerContainer className="space-y-2">
                {cycles?.map((cycle) => (
                  <StaggerItem key={cycle.cycleId}>
                    {renderCycleRow(cycle)}
                  </StaggerItem>
                ))}
              </StaggerContainer>
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

      <CycleFormDialog
        open={formDialogOpen}
        onOpenChange={handleDialogClose}
        cycle={editingCycle}
        onUpdated={() => refetch()}
      />
      </div>
    </PageTransition>
  );
}
