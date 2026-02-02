'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCycles, useDeleteCycle, useCycle } from '@/hooks';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { FullPageSkeleton } from '@/components/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { NoCyclesEmpty } from '@/components/ui/empty-state';
import { Plus, ChevronsUpDown, ChevronsDownUp, Merge } from 'lucide-react';
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
import { CycleFormDialog } from '@/components/cycle-form-dialog';
import { CycleCard } from '@/components/cycle-card';
import { MergeCyclesDialog } from '@/components/merge-cycles-dialog';

export default function CyclesPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Set initial tab from URL parameter directly
  const [activeTab, setActiveTab] = useState(
    tabParam === 'completed' || tabParam === 'Completed' ? 'Completed' : 'Active'
  );
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  // Expand/collapse all: undefined = individual control, true = all expanded, false = all collapsed
  const [expandAllState, setExpandAllState] = useState<boolean | undefined>(true);

  // Active cycles: oldest first (ASC), Completed: newest first (DESC)
  const sortOrder = activeTab === 'Active' ? 'asc' : 'desc';
  const { data: cycles, isLoading, refetch } = useCycles(activeTab, sortOrder);
  const deleteMutation = useDeleteCycle();

  // Calculate if merge is available (2+ active cycles that haven't been merged)
  const { data: activeCyclesForMerge } = useCycles('Active', 'asc');
  const canMerge = useMemo(() => {
    if (!activeCyclesForMerge) return false;
    const availableForMerge = activeCyclesForMerge.filter((c) => !c.isMerged);
    return availableForMerge.length >= 2;
  }, [activeCyclesForMerge]);

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
          <div className="flex gap-2">
            {canMerge && (
              <Button variant="outline" onClick={() => setMergeDialogOpen(true)}>
                <Merge className="mr-2 h-4 w-4" />
                Merge Cycles
              </Button>
            )}
            <Button onClick={handleNewCycle}>
              <Plus className="mr-2 h-4 w-4" />
              New Cycle
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="Active">Active</TabsTrigger>
              <TabsTrigger value="Completed">Completed</TabsTrigger>
            </TabsList>
            {/* Expand/Collapse All toggle */}
            {cycles && cycles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandAllState(prev => prev === true ? false : true)}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                title={expandAllState === true ? 'Collapse all' : 'Expand all'}
              >
                {expandAllState === true ? (
                  <ChevronsDownUp className="h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4" />
                )}
                <span className="sr-only md:not-sr-only md:ml-1 text-xs">
                  {expandAllState === true ? 'Collapse' : 'Expand'}
                </span>
              </Button>
            )}
          </div>

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
                    <CycleCard
                      cycle={cycle}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      plainStyle={activeTab === 'Completed'}
                      expandedOverride={expandAllState}
                      onExpandedChange={() => setExpandAllState(undefined)}
                    />
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

      <MergeCyclesDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        cyclesToMerge={activeCyclesForMerge || []}
        onSuccess={() => refetch()}
      />
      </div>
    </PageTransition>
  );
}
