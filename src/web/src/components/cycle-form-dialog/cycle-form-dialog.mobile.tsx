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
import { AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SpecimenMultiSelect, type SpecimenSelection } from '@/components/specimen-select';
import { AddCustomSpecimenDialog, type CustomSpecimenCreatedData } from '@/components/add-custom-specimen-dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CycleFormDialogProps } from './types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  startDate: z.string().min(1, 'Start date is required'),
  additionalSpecimens: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CycleFormDialogMobile({
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

  // Mobile-specific state
  const [additionalExpanded, setAdditionalExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const createMutation = useCreateCycle();
  const updateMutation = useUpdateCycle();

  // Handle when a custom specimen is created - add it to the selection
  const handleCustomSpecimenCreated = (data: CustomSpecimenCreatedData) => {
    setSelectedSpecimenItems(prev => [...prev, { id: data.userSpecimenId, source: 'user' }]);
    setSpecimenError(null);
  };

  const { data: tumblers } = useQuery({
    queryKey: ['tumblers'],
    queryFn: tumblerApi.getAll,
    enabled: open && !isEditMode,
  });

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
        form.reset({
          name: cycle.name,
          startDate: cycle.startDate.split('T')[0],
          additionalSpecimens: 'additionalSpecimens' in cycle ? (cycle.additionalSpecimens || '') : '',
          notes: 'notes' in cycle ? (cycle.notes || '') : '',
        });
        if ('specimens' in cycle && cycle.specimens) {
          const specimenSelections: SpecimenSelection[] = cycle.specimens.map(s => ({
            id: s.specimenId,
            source: s.source || 'system',
            inventorySpecimenId: s.inventorySpecimenId ?? undefined,
          }));
          setSelectedSpecimenItems(specimenSelections);
          setOriginalSpecimenItems(specimenSelections);
        } else {
          setSelectedSpecimenItems([]);
          setOriginalSpecimenItems([]);
        }
        // Expand sections if they have content
        setAdditionalExpanded(!!('additionalSpecimens' in cycle && cycle.additionalSpecimens));
        setNotesExpanded(!!('notes' in cycle && cycle.notes));
      } else {
        form.reset({
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          additionalSpecimens: '',
          notes: '',
        });
        setSelectedSpecimenItems([]);
        setOriginalSpecimenItems([]);
        setAdditionalExpanded(false);
        setNotesExpanded(false);
      }
      setSpecimenError(null);
    }
  }, [open, cycle, form]);

  const selectedSpecimens = useMemo(() => {
    if (isEditMode) return [];
    const selectedIds = new Set(selectedSpecimenItems.map(s => s.id));
    return allSpecimens.filter((s) => selectedIds.has(s.id));
  }, [allSpecimens, selectedSpecimenItems, isEditMode]);

  const watchedStartDate = form.watch('startDate');

  // Auto-populate cycle name
  useEffect(() => {
    if (isEditMode || !watchedStartDate) return;

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

    const specimenNames = selectedSpecimens
      .slice(0, 3)
      .map((s) => s.commonName)
      .join(', ');

    const suffix = selectedSpecimens.length > 3 ? ` +${selectedSpecimens.length - 3} more` : '';
    const specimenPart = specimenNames ? `${specimenNames}${suffix}` : 'New Cycle';

    form.setValue('name', `${specimenPart} - ${formattedDate}`);
  }, [selectedSpecimens, watchedStartDate, form, userSettings?.dateFormat, isEditMode]);

  const onSubmit = (data: FormValues) => {
    if (isEditMode && cycle) {
      const cycleId = 'cycleId' in cycle ? cycle.cycleId : '';

      const currentSelectionKey = (item: SpecimenSelection) =>
        item.inventorySpecimenId || `${item.source}-${item.id}`;
      const currentSelectionKeys = new Set(selectedSpecimenItems.map(currentSelectionKey));

      const removedItems = originalSpecimenItems.filter(
        orig => !currentSelectionKeys.has(currentSelectionKey(orig))
      );

      const removedInventorySpecimenIds = removedItems
        .filter(s => s.inventorySpecimenId)
        .map(s => s.inventorySpecimenId!);
      const removedSystemSpecimenIds = removedItems
        .filter(s => !s.inventorySpecimenId && s.source === 'system')
        .map(s => s.id);
      const removedUserSpecimenIds = removedItems
        .filter(s => !s.inventorySpecimenId && s.source === 'user')
        .map(s => s.id);

      const originalSelectionKeys = new Set(originalSpecimenItems.map(currentSelectionKey));
      const newItems = selectedSpecimenItems.filter(
        item => !originalSelectionKeys.has(currentSelectionKey(item))
      );

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
      const hasSelectedSpecimens = selectedSpecimenItems.length > 0;
      const hasAdditionalSpecimens = data.additionalSpecimens && data.additionalSpecimens.trim().length > 0;

      if (!hasSelectedSpecimens && !hasAdditionalSpecimens) {
        setSpecimenError('Please select specimens from the list or add other specimens');
        return;
      }

      const regularSpecimens = selectedSpecimenItems.filter(s => !s.inventorySpecimenId);
      const inventorySpecimensData = selectedSpecimenItems.filter(s => s.inventorySpecimenId);

      const systemSpecimenIds = regularSpecimens
        .filter(s => s.source === 'system')
        .map(s => s.id);
      const userSpecimenIds = regularSpecimens
        .filter(s => s.source === 'user')
        .map(s => s.id);

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
            router.push(`/cycles/${newCycle.cycleId}?addStage=true`);
            onCreated?.(newCycle.cycleId);
          },
        }
      );
    }
  };

  const hasTumblers = !isEditMode ? (tumblers && tumblers.length > 0) : true;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const watchedAdditionalSpecimens = form.watch('additionalSpecimens');
  const watchedNotes = form.watch('notes');

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] flex flex-col p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle>{isEditMode ? 'Edit Cycle' : 'Start New Cycle'}</SheetTitle>
            <SheetDescription>
              {isEditMode
                ? 'Update cycle details'
                : 'Begin tracking a new tumbling cycle'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {!isEditMode && !hasTumblers && (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You need to add a tumbler before starting a cycle.{' '}
                  <Link href="/tumblers/new" className="font-medium underline">
                    Add a tumbler first
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form id="cycle-form-mobile" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-12 text-base" />
                      </FormControl>
                      <FormDescription className="text-helpful-tip">
                        The date your first tumbling stage begins
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-base font-semibold">Rocks/Specimens *</FormLabel>
                  <SpecimenMultiSelect
                    selectedItems={selectedSpecimenItems}
                    onSelectionChange={(items) => {
                      setSelectedSpecimenItems(items);
                      if (items.length > 0) setSpecimenError(null);
                    }}
                    placeholder="Select specimens..."
                    onAddCustom={() => setIsAddSpecimenDialogOpen(true)}
                    enableInventoryMode={true}
                  />
                  <FormDescription className="text-helpful-tip">
                    Select the types of rocks you&apos;re tumbling
                  </FormDescription>
                  {specimenError && (
                    <p className="text-sm font-medium text-destructive">{specimenError}</p>
                  )}
                </FormItem>

                {/* Other Specimens - Collapsible */}
                <Collapsible open={additionalExpanded} onOpenChange={setAdditionalExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent w-full justify-start">
                      <FormLabel className="text-base font-semibold cursor-pointer">
                        Other Specimens {watchedAdditionalSpecimens && "(1)"}
                      </FormLabel>
                      <ChevronDown className={cn(
                        "h-4 w-4 ml-2 transition-transform",
                        additionalExpanded && "rotate-180"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <FormField
                      control={form.control}
                      name="additionalSpecimens"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Any specimens not in the list above..."
                              className="min-h-[80px] text-base"
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
                  </CollapsibleContent>
                </Collapsible>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Cycle Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Beach Agates Batch 1"
                          {...field}
                          className="h-12 text-base"
                        />
                      </FormControl>
                      <FormDescription className="text-helpful-tip">
                        A descriptive name to identify this batch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes - Collapsible */}
                <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent w-full justify-start">
                      <FormLabel className="text-base font-semibold cursor-pointer">
                        Notes {watchedNotes && "(1)"}
                      </FormLabel>
                      <ChevronDown className={cn(
                        "h-4 w-4 ml-2 transition-transform",
                        notesExpanded && "rotate-180"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional notes about this cycle..."
                              className="min-h-[100px] text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </form>
            </Form>
          </div>

          <SheetFooter className="p-4 border-t bg-background">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="cycle-form-mobile"
                disabled={isPending || (!isEditMode && !hasTumblers)}
                className="flex-1 h-12 text-base"
              >
                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isEditMode ? 'Save' : 'Start Cycle'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Custom Specimen Dialog */}
      <AddCustomSpecimenDialog
        open={isAddSpecimenDialogOpen}
        onOpenChange={setIsAddSpecimenDialogOpen}
        onSuccess={handleCustomSpecimenCreated}
      />
    </>
  );
}
