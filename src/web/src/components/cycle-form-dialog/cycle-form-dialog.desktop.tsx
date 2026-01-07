'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tumblerApi, userApi } from '@/lib/api';
import { useSpecimenSearch } from '@/hooks/use-user-specimens';
import { useCreateCycle, useUpdateCycle } from '@/hooks/use-cycles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SpecimenMultiSelect, type SpecimenSelection } from '@/components/specimen-select';
import { AddCustomSpecimenDialog, type CustomSpecimenCreatedData } from '@/components/add-custom-specimen-dialog';
import Link from 'next/link';
import type { CycleFormDialogProps } from './types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  startDate: z.string().min(1, 'Start date is required'),
  additionalSpecimens: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CycleFormDialogDesktop({
  open,
  onOpenChange,
  cycle,
  onCreated,
  onUpdated,
}: CycleFormDialogProps) {
  const router = useRouter();
  const isEditMode = !!cycle;
  const [selectedSpecimenItems, setSelectedSpecimenItems] = useState<SpecimenSelection[]>([]);
  const [originalSpecimenItems, setOriginalSpecimenItems] = useState<SpecimenSelection[]>([]);
  const [specimenError, setSpecimenError] = useState<string | null>(null);
  const [isAddSpecimenDialogOpen, setIsAddSpecimenDialogOpen] = useState(false);

  const createMutation = useCreateCycle();
  const updateMutation = useUpdateCycle();

  // Handle when a custom specimen is created - add it to the selection
  const handleCustomSpecimenCreated = (data: CustomSpecimenCreatedData) => {
    if (data.specimenId) {
      // High-confidence AI result - added to system specimens
      setSelectedSpecimenItems(prev => [...prev, { id: data.specimenId!, source: 'system' }]);
    } else if (data.userSpecimenId) {
      // Low-confidence or manual entry - added to user specimens
      setSelectedSpecimenItems(prev => [...prev, { id: data.userSpecimenId!, source: 'user' }]);
    }
    setSpecimenError(null);
  };

  const { data: tumblers } = useQuery({
    queryKey: ['tumblers'],
    queryFn: tumblerApi.getAll,
    enabled: open && !isEditMode, // Only need tumblers check for new cycles
  });

  // Use specimen search to get both system and user specimens for name generation
  const { data: allSpecimens = [] } = useSpecimenSearch();

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userApi.getSettings,
    staleTime: 1000 * 60 * 5,
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      additionalSpecimens: '',
      notes: '',
    },
  });

  // Reset form when dialog opens/closes or cycle changes
  useEffect(() => {
    if (open) {
      if (cycle) {
        // Edit mode - populate with existing values
        form.reset({
          name: cycle.name,
          startDate: cycle.startDate.split('T')[0],
          additionalSpecimens: 'additionalSpecimens' in cycle ? (cycle.additionalSpecimens || '') : '',
          notes: 'notes' in cycle ? (cycle.notes || '') : '',
        });
        // In edit mode, show current specimens
        if ('specimens' in cycle && cycle.specimens) {
          const specimenSelections: SpecimenSelection[] = cycle.specimens.map(s => ({
            id: s.specimenId,
            source: s.source || 'system',
            inventorySpecimenId: s.inventorySpecimenId ?? undefined,
          }));
          setSelectedSpecimenItems(specimenSelections);
          setOriginalSpecimenItems(specimenSelections); // Track original for removal detection
        } else {
          setSelectedSpecimenItems([]);
          setOriginalSpecimenItems([]);
        }
      } else {
        // Create mode - reset to defaults
        form.reset({
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          additionalSpecimens: '',
          notes: '',
        });
        setSelectedSpecimenItems([]);
        setOriginalSpecimenItems([]);
      }
      setSpecimenError(null);
    }
  }, [open, cycle, form]);

  // Get selected specimens for cycle name generation (only in create mode)
  const selectedSpecimens = useMemo(() => {
    if (isEditMode) return [];
    const selectedIds = new Set(selectedSpecimenItems.map(s => s.id));
    return allSpecimens.filter((s) => selectedIds.has(s.id));
  }, [allSpecimens, selectedSpecimenItems, isEditMode]);

  // Watch start date for cycle name auto-population (only in create mode)
  const watchedStartDate = form.watch('startDate');

  // Auto-populate cycle name based on selected specimens and start date (only in create mode)
  useEffect(() => {
    if (isEditMode || !watchedStartDate) return;

    // Format date based on user settings
    const formatDate = (dateStr: string, format: string) => {
      const date = new Date(dateStr);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();

      switch (format) {
        case 'DDMMYYYY':
          return `${day}/${month}/${year}`;
        case 'YYYYMMDD':
          return `${year}-${month}-${day}`;
        case 'MMDDYYYY':
        default:
          return `${month}/${day}/${year}`;
      }
    };

    const dateFormat = userSettings?.dateFormat || 'MMDDYYYY';
    const formattedDate = formatDate(watchedStartDate, dateFormat);

    // Build cycle name from selected specimens
    const specimenNames = selectedSpecimens
      .slice(0, 3) // Limit to first 3 specimens to keep name reasonable
      .map((s) => s.commonName)
      .join(', ');

    const suffix = selectedSpecimens.length > 3 ? ` +${selectedSpecimens.length - 3} more` : '';
    const specimenPart = specimenNames ? `${specimenNames}${suffix}` : 'New Cycle';

    form.setValue('name', `${specimenPart} - ${formattedDate}`);
  }, [selectedSpecimens, watchedStartDate, form, userSettings?.dateFormat, isEditMode]);

  const onSubmit = (data: FormValues) => {
    if (isEditMode && cycle) {
      // Update existing cycle
      const cycleId = 'cycleId' in cycle ? cycle.cycleId : '';

      // Build a set of currently selected items for comparison
      const currentSelectionKey = (item: SpecimenSelection) =>
        item.inventorySpecimenId || `${item.source}-${item.id}`;
      const currentSelectionKeys = new Set(selectedSpecimenItems.map(currentSelectionKey));

      // Find REMOVED specimens (in original but not in current)
      const removedItems = originalSpecimenItems.filter(
        orig => !currentSelectionKeys.has(currentSelectionKey(orig))
      );

      // Separate removed items by type
      const removedInventorySpecimenIds = removedItems
        .filter(s => s.inventorySpecimenId)
        .map(s => s.inventorySpecimenId!);
      const removedSystemSpecimenIds = removedItems
        .filter(s => !s.inventorySpecimenId && s.source === 'system')
        .map(s => s.id);
      const removedUserSpecimenIds = removedItems
        .filter(s => !s.inventorySpecimenId && s.source === 'user')
        .map(s => s.id);

      // Find NEW specimens (in current but not in original)
      const originalSelectionKeys = new Set(originalSpecimenItems.map(currentSelectionKey));
      const newItems = selectedSpecimenItems.filter(
        item => !originalSelectionKeys.has(currentSelectionKey(item))
      );

      // Separate new specimens by type
      const newRegularSpecimens = newItems.filter(s => !s.inventorySpecimenId);
      const newInventorySpecimens = newItems.filter(s => s.inventorySpecimenId);

      const newSystemSpecimenIds = newRegularSpecimens
        .filter(s => s.source === 'system')
        .map(s => s.id);
      const newUserSpecimenIds = newRegularSpecimens
        .filter(s => s.source === 'user')
        .map(s => s.id);

      const newInventorySpecimensData = newInventorySpecimens.map(s => ({
        inventorySpecimenId: s.inventorySpecimenId!,
        markDepletedOnComplete: s.markDepletedOnComplete || false,
        addPhotosFromInventory: s.addPhotosFromInventory || false,
      }));

      updateMutation.mutate(
        {
          id: cycleId,
          data: {
            name: data.name,
            startDate: data.startDate,
            additionalSpecimens: data.additionalSpecimens || undefined,
            notes: data.notes || undefined,
            specimenIds: newSystemSpecimenIds.length > 0 ? newSystemSpecimenIds : undefined,
            userSpecimenIds: newUserSpecimenIds.length > 0 ? newUserSpecimenIds : undefined,
            inventorySpecimens: newInventorySpecimensData.length > 0 ? newInventorySpecimensData : undefined,
            removedSpecimenIds: removedSystemSpecimenIds.length > 0 ? removedSystemSpecimenIds : undefined,
            removedUserSpecimenIds: removedUserSpecimenIds.length > 0 ? removedUserSpecimenIds : undefined,
            removedInventorySpecimenIds: removedInventorySpecimenIds.length > 0 ? removedInventorySpecimenIds : undefined,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onUpdated?.();
          },
        }
      );
    } else {
      // Create new cycle
      // Validate that at least one specimen source is provided
      const hasSelectedSpecimens = selectedSpecimenItems.length > 0;
      const hasAdditionalSpecimens = data.additionalSpecimens && data.additionalSpecimens.trim().length > 0;

      if (!hasSelectedSpecimens && !hasAdditionalSpecimens) {
        setSpecimenError('Please select specimens from the list or add other specimens');
        return;
      }

      // Separate regular specimens from inventory specimens
      const regularSpecimens = selectedSpecimenItems.filter(s => !s.inventorySpecimenId);
      const inventorySpecimensData = selectedSpecimenItems.filter(s => s.inventorySpecimenId);

      // Separate system and user specimen IDs (for regular specimens only)
      const systemSpecimenIds = regularSpecimens
        .filter(s => s.source === 'system')
        .map(s => s.id);
      const userSpecimenIds = regularSpecimens
        .filter(s => s.source === 'user')
        .map(s => s.id);

      // Build inventory specimens array
      const inventorySpecimens = inventorySpecimensData.map(s => ({
        inventorySpecimenId: s.inventorySpecimenId!,
        markDepletedOnComplete: s.markDepletedOnComplete || false,
        addPhotosFromInventory: s.addPhotosFromInventory || false,
      }));

      setSpecimenError(null);
      createMutation.mutate(
        {
          name: data.name,
          startDate: data.startDate,
          additionalSpecimens: data.additionalSpecimens || undefined,
          notes: data.notes || undefined,
          specimenIds: systemSpecimenIds.length > 0 ? systemSpecimenIds : undefined,
          userSpecimenIds: userSpecimenIds.length > 0 ? userSpecimenIds : undefined,
          inventorySpecimens: inventorySpecimens.length > 0 ? inventorySpecimens : undefined,
        },
        {
          onSuccess: (newCycle) => {
            onOpenChange(false);
            // Navigate to the new cycle with addStage=true to open stage dialog
            router.push(`/cycles/${newCycle.cycleId}?addStage=true`);
            onCreated?.(newCycle.cycleId);
          },
        }
      );
    }
  };

  const hasTumblers = !isEditMode ? (tumblers && tumblers.length > 0) : true;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Cycle' : 'Start New Cycle'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update cycle details'
                : 'Begin tracking a new tumbling cycle'}
            </DialogDescription>
          </DialogHeader>

          {!isEditMode && !hasTumblers && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to add a tumbler before starting a cycle.{' '}
                <Link href="/tumblers/new" className="font-medium underline hover:text-amber-100">
                  Add a tumbler first
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-helpful-tip">
                      The date your first tumbling stage begins
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Rocks/Specimens *</FormLabel>
                <SpecimenMultiSelect
                  selectedItems={selectedSpecimenItems}
                  onSelectionChange={(items) => {
                    setSelectedSpecimenItems(items);
                    if (items.length > 0) setSpecimenError(null);
                  }}
                  placeholder="Select specimens from the list..."
                  onAddCustom={() => setIsAddSpecimenDialogOpen(true)}
                  enableInventoryMode={true}
                />
                <FormDescription className="text-helpful-tip">
                  Select the types of rocks you&apos;re tumbling. Click the package icon to select from your inventory.
                </FormDescription>
                {specimenError && (
                  <p className="text-sm font-medium text-destructive">{specimenError}</p>
                )}
              </FormItem>

              <FormField
                control={form.control}
                name="additionalSpecimens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Specimens *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specimens not in the list above..."
                        className="min-h-[60px]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.trim()) setSpecimenError(null);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Add any additional rocks not found in the dropdown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Beach Agates Batch 1" {...field} />
                    </FormControl>
                    <FormDescription className="text-helpful-tip">
                      A descriptive name to identify this batch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes about this cycle..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || (!isEditMode && !hasTumblers)}
                  className="flex-1"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Save Changes' : 'Start Cycle'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Custom Specimen Dialog */}
      <AddCustomSpecimenDialog
        open={isAddSpecimenDialogOpen}
        onOpenChange={setIsAddSpecimenDialogOpen}
        onSuccess={handleCustomSpecimenCreated}
      />
    </>
  );
}
