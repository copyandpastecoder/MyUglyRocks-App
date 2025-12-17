'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInventoryItem, useUpdateInventory, useDeleteInventory } from '@/hooks/use-inventory';
import { useTimezone } from '@/hooks/use-user';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FullPageSkeleton } from '@/components/skeletons';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddCustomSpecimenDialog, type CustomSpecimenCreatedData } from '@/components/add-custom-specimen-dialog';
import { InventoryPhotos } from '@/components/inventory-photos';
import { SpecimenRowList, type SpecimenRowItem } from '@/components/specimen-row-list';
import { InventorySourcePicker } from '@/components/inventory-source-picker';
import { InventorySourceFormDialog } from '@/components/inventory-source-form-dialog';
import { ArrowLeft, Loader2, Trash2, Package, Share2, MapPin, Phone, Globe, User, Store, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';
import {
  INVENTORY_STATUS_COLORS,
} from '@/lib/inventory-constants';
import { sourceTypeDisplayNames } from '@/types/inventory-source';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  acquiredDate: z.string().min(1, 'Acquired date is required'),
  inventorySourceId: z.string().nullable(),
  storageLocation: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { formatDate } = useTimezone();
  const id = params.id as string;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [specimenRows, setSpecimenRows] = useState<SpecimenRowItem[]>([]);
  const [specimenError, setSpecimenError] = useState<string | null>(null);
  const [isAddSpecimenDialogOpen, setIsAddSpecimenDialogOpen] = useState(false);
  const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false);
  const [isSourceDetailsOpen, setIsSourceDetailsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedForm = useRef(false);
  const hasInitializedSpecimens = useRef(false);

  const { data: inventory, isLoading, refetch: refetchInventory } = useInventoryItem(id);
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      acquiredDate: '',
      inventorySourceId: null,
      storageLocation: '',
      notes: '',
    },
  });

  // Reset form when inventory data loads (once only)
  useEffect(() => {
    if (!hasInitializedForm.current && inventory) {
      hasInitializedForm.current = true;
      form.reset({
        name: inventory.name,
        acquiredDate: inventory.acquiredDate,
        inventorySourceId: inventory.inventorySourceId || null,
        storageLocation: inventory.storageLocation || '',
        notes: inventory.notes || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time initialization, form.reset is stable
  }, [inventory]);

  // Initialize specimen rows when inventory loads (once only)
  useEffect(() => {
    if (!hasInitializedSpecimens.current && inventory?.specimens) {
      hasInitializedSpecimens.current = true;
      const rows: SpecimenRowItem[] = inventory.specimens
        .filter(s => s.specimenId || s.userSpecimenId)
        .map(s => ({
          id: crypto.randomUUID(),
          inventorySpecimenId: s.inventorySpecimenId, // preserve to maintain photo tags
          specimenId: s.specimenId ?? undefined,
          userSpecimenId: s.userSpecimenId ?? undefined,
          selectedId: (s.specimenId || s.userSpecimenId) as string,
          source: s.source,
          commonName: s.commonName,
          weightGrams: s.weightGrams,
          cost: s.cost,
          condition: s.condition || 'Raw',
          qualityRating: s.qualityRating,
          sizeCategories: s.sizeCategories || [],
          notes: s.notes ?? undefined,
          status: s.status || 'Available',
          storageLocation: s.storageLocation ?? undefined,
          url: s.url ?? undefined,
        }));
      setSpecimenRows(rows);
    }
  }, [inventory]);

  // Handle name editing
  const startEditingName = useCallback(() => {
    if (inventory) {
      setEditedName(inventory.name);
      setIsEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [inventory]);

  const cancelEditingName = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  const saveEditedName = useCallback(() => {
    if (!editedName.trim() || !inventory) {
      cancelEditingName();
      return;
    }
    // Update the form field so it saves with the rest of the form
    form.setValue('name', editedName.trim());
    setIsEditingName(false);
  }, [editedName, inventory, form, cancelEditingName]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditedName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  }, [saveEditedName, cancelEditingName]);

  // Handle when a custom specimen is created - add a new row with that specimen pre-selected
  const handleCustomSpecimenCreated = (data: CustomSpecimenCreatedData) => {
    // Create a new row with the custom specimen already selected
    const newRow: SpecimenRowItem = {
      id: crypto.randomUUID(),
      selectedId: data.userSpecimenId,
      userSpecimenId: data.userSpecimenId,
      source: 'user',
      commonName: data.commonName,
      scientificName: data.scientificName ?? undefined,
      tumblingDifficulty: data.tumblingDifficulty ?? undefined,
      weightGrams: null,
      cost: null,
      condition: 'Raw',
      qualityRating: null,
      sizeCategories: [],
      status: 'Available',
      storageLocation: undefined,
      url: undefined,
    };
    setSpecimenRows(prev => [...prev, newRow]);
    setSpecimenError(null);
  };

  const onSubmit = async (data: FormValues) => {
    // Validate specimens
    const validSpecimens = specimenRows.filter(r => r.selectedId);
    if (validSpecimens.length === 0) {
      setSpecimenError('At least one specimen is required');
      return;
    }
    setSpecimenError(null);

    // Build specimens payload with all per-specimen fields
    // Include inventorySpecimenId for existing specimens to preserve photo tags
    const specimensPayload = validSpecimens.map(row => ({
      inventorySpecimenId: row.inventorySpecimenId || undefined,
      specimenId: row.specimenId,
      userSpecimenId: row.userSpecimenId,
      weightGrams: row.weightGrams ?? undefined,
      cost: row.cost ?? undefined,
      condition: row.condition,
      qualityRating: row.qualityRating ?? undefined,
      sizeCategories: row.sizeCategories.length > 0 ? row.sizeCategories : undefined,
      notes: row.notes || undefined,
      status: row.status,
      storageLocation: row.storageLocation || undefined,
      url: row.url || undefined,
    }));

    // Update inventory (aggregates are calculated on backend from specimens)
    updateMutation.mutate({
      id,
      data: {
        name: data.name,
        acquiredDate: data.acquiredDate,
        inventorySourceId: data.inventorySourceId || undefined,
        displayUnit: 'lb',
        storageLocation: data.storageLocation || undefined,
        notes: data.notes || undefined,
        specimens: specimensPayload,
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        router.push('/inventory');
      },
    });
  };

  if (isLoading) {
    return <FullPageSkeleton cardCount={2} />;
  }

  if (!inventory) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium">Inventory not found</h2>
          <p className="text-muted-foreground mb-4">This item may have been deleted.</p>
          <Button asChild>
            <Link href="/inventory">Back to Inventory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                ref={nameInputRef}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={saveEditedName}
                className="text-2xl font-bold h-auto py-1 px-2"
                maxLength={255}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={saveEditedName}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={cancelEditingName}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <h1
                className="text-2xl font-bold tracking-tight truncate cursor-pointer hover:text-primary transition-colors"
                onClick={startEditingName}
                title="Click to edit name"
              >
                {form.watch('name') || inventory.name}
              </h1>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={startEditingName}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <p className="text-muted-foreground">
            Acquired {formatDate(inventory.acquiredDate, 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant="secondary" className={INVENTORY_STATUS_COLORS[inventory.status]}>
          {inventory.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acquisition Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="acquiredDate"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Date Acquired *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Source Section - Clean integrated design */}
              <FormField
                control={form.control}
                name="inventorySourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    {inventory.inventorySource && !isSourceDetailsOpen ? (
                      // Display mode - show source info card
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{inventory.inventorySource.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {sourceTypeDisplayNames[inventory.inventorySource.sourceType]}
                              </Badge>
                            </div>

                            {/* Source details in a compact grid */}
                            {(inventory.inventorySource.location || inventory.inventorySource.contactName || inventory.inventorySource.phone || inventory.inventorySource.url) ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                {inventory.inventorySource.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{inventory.inventorySource.location}</span>
                                  </div>
                                )}
                                {inventory.inventorySource.contactName && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{inventory.inventorySource.contactName}</span>
                                  </div>
                                )}
                                {inventory.inventorySource.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                    <a href={`tel:${inventory.inventorySource.phone}`} className="text-primary hover:underline">
                                      {inventory.inventorySource.phone}
                                    </a>
                                  </div>
                                )}
                                {inventory.inventorySource.url && (
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 shrink-0" />
                                    <a
                                      href={inventory.inventorySource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline truncate"
                                    >
                                      {new URL(inventory.inventorySource.url).hostname}
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No additional details.{' '}
                                <Link href="/inventory/sources" className="text-primary hover:underline">
                                  Edit source
                                </Link>
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSourceDetailsOpen(true)}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Edit mode - show picker
                      <div className="space-y-2">
                        <FormControl>
                          <InventorySourcePicker
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              // Close edit mode after selection if we have a source
                              if (value) {
                                setTimeout(() => setIsSourceDetailsOpen(false), 100);
                              }
                            }}
                            onAddNew={() => setIsAddSourceDialogOpen(true)}
                            placeholder="Select where you acquired this..."
                          />
                        </FormControl>
                        {inventory.inventorySource && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSourceDetailsOpen(false)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                    <FormDescription>
                      Where did you acquire this material?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Specimens - expandable cards with all fields */}
              <SpecimenRowList
                specimens={specimenRows}
                onSpecimensChange={(rows) => {
                  setSpecimenRows(rows);
                  if (rows.filter(r => r.selectedId).length > 0) {
                    setSpecimenError(null);
                  }
                }}
                onAddCustom={() => setIsAddSpecimenDialogOpen(true)}
                error={specimenError}
              />

              <FormField
                control={form.control}
                name="storageLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Garage shelf 2, Bucket A" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where do you keep this material?
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
                        placeholder="Any additional notes..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </form>
          </Form>
        </CardContent>
      </Card>

      <InventoryPhotos
        inventoryId={id}
        photos={inventory.photos}
        specimens={inventory.specimens}
        onPhotosChange={() => refetchInventory()}
      />

      <div className="flex gap-4">
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        {inventory.photos.length > 0 && (
          <Button variant="secondary" asChild>
            <Link href={`/inventory/${id}/share`}>
              <Share2 className="mr-2 h-4 w-4" />
              Share to Gallery
            </Link>
          </Button>
        )}
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to delete &quot;{inventory.name}&quot;?</p>
                {inventory.specimens.length > 0 && (
                  <p className="text-amber-600 dark:text-amber-500 font-medium">
                    This will also delete {inventory.specimens.length} specimen{inventory.specimens.length !== 1 ? 's' : ''} and all associated data.
                  </p>
                )}
                <p className="text-muted-foreground">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Custom Specimen Dialog */}
      <AddCustomSpecimenDialog
        open={isAddSpecimenDialogOpen}
        onOpenChange={setIsAddSpecimenDialogOpen}
        onSuccess={handleCustomSpecimenCreated}
      />

      {/* Add Source Dialog */}
      <InventorySourceFormDialog
        open={isAddSourceDialogOpen}
        onOpenChange={setIsAddSourceDialogOpen}
        onSuccess={(sourceId) => form.setValue('inventorySourceId', sourceId)}
      />
    </div>
  );
}
