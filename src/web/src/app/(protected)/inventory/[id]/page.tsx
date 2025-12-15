'use client';

import { useState, useEffect, useRef } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { ArrowLeft, Loader2, Trash2, Package, Star, Share2 } from 'lucide-react';
import Link from 'next/link';
import type { InventoryStatus, SourceType } from '@/types/inventory';
import {
  INVENTORY_STATUS_COLORS,
  INVENTORY_STATUS_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from '@/lib/inventory-constants';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  acquiredDate: z.string().min(1, 'Acquired date is required'),
  sourceType: z.string().min(1, 'Source type is required'),
  sourceName: z.string().max(255).optional(),
  sourceLocation: z.string().max(255).optional(),
  sourceUrl: z.string().url().max(500).optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
  storageLocation: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  isFavorite: z.boolean().default(false),
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
  const hasInitializedForm = useRef(false);
  const hasInitializedSpecimens = useRef(false);

  const { data: inventory, isLoading, refetch: refetchInventory } = useInventoryItem(id);
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type inference limitation
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      acquiredDate: '',
      sourceType: '',
      sourceName: '',
      sourceLocation: '',
      sourceUrl: '',
      status: '',
      storageLocation: '',
      notes: '',
      isFavorite: false,
    },
  });

  // Reset form when inventory data loads (once only)
  useEffect(() => {
    if (!hasInitializedForm.current && inventory) {
      hasInitializedForm.current = true;
      form.reset({
        name: inventory.name,
        acquiredDate: inventory.acquiredDate,
        sourceType: inventory.sourceType,
        sourceName: inventory.sourceName || '',
        sourceLocation: inventory.sourceLocation || '',
        sourceUrl: inventory.sourceUrl || '',
        status: inventory.status,
        storageLocation: inventory.storageLocation || '',
        notes: inventory.notes || '',
        isFavorite: inventory.isFavorite,
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
        }));
      setSpecimenRows(rows);
    }
  }, [inventory]);

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
    const specimensPayload = validSpecimens.map(row => ({
      specimenId: row.specimenId,
      userSpecimenId: row.userSpecimenId,
      weightGrams: row.weightGrams ?? undefined,
      cost: row.cost ?? undefined,
      condition: row.condition,
      qualityRating: row.qualityRating ?? undefined,
      sizeCategories: row.sizeCategories.length > 0 ? row.sizeCategories : undefined,
    }));

    // Update inventory (aggregates are calculated on backend from specimens)
    updateMutation.mutate({
      id,
      data: {
        name: data.name,
        acquiredDate: data.acquiredDate,
        sourceType: data.sourceType as SourceType,
        sourceName: data.sourceName || undefined,
        sourceLocation: data.sourceLocation || undefined,
        sourceUrl: data.sourceUrl || undefined,
        displayUnit: 'lb',
        status: data.status as InventoryStatus,
        storageLocation: data.storageLocation || undefined,
        notes: data.notes || undefined,
        isFavorite: data.isFavorite,
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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{inventory.name}</h1>
            {inventory.isFavorite && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
          </div>
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

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How did you acquire this?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_TYPE_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Store name, website, location..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sourceLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State or general area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://..."
                          {...field}
                          onBlur={(e) => {
                            let value = e.target.value.trim();
                            if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                              value = 'https://' + value;
                              field.onChange(value);
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                name="status"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INVENTORY_STATUS_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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

              <FormField
                control={form.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Favorite</FormLabel>
                      <FormDescription>
                        Mark this as a favorite for quick filtering
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rock Shop - Agates - Dec 13, 2025" {...field} />
                    </FormControl>
                    <FormDescription>
                      Display name for this inventory item
                    </FormDescription>
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
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{inventory.name}&quot;? This action cannot be undone.
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
    </div>
  );
}
