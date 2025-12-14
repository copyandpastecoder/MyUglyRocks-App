'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInventoryItem, useUpdateInventory, useDeleteInventory } from '@/hooks/use-inventory';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { SpecimenMultiSelect, type SpecimenSelection } from '@/components/specimen-multi-select';
import { AddCustomSpecimenDialog } from '@/components/add-custom-specimen-dialog';
import { WeightInput } from '@/components/weight-input';
import { InventoryPhotos } from '@/components/inventory-photos';
import { StarRating } from '@/components/star-rating';
import { ArrowLeft, Loader2, Trash2, Package, Star, Share2 } from 'lucide-react';
import Link from 'next/link';
import type { SourceType, InventoryCondition, SizeCategory, InventoryStatus } from '@/types/inventory';

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'Store', label: 'Store (physical)' },
  { value: 'Online', label: 'Online' },
  { value: 'Found', label: 'Found / Collected' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Trade', label: 'Trade' },
  { value: 'Other', label: 'Other' },
];

const CONDITIONS: { value: InventoryCondition; label: string }[] = [
  { value: 'Raw', label: 'Raw (unprocessed)' },
  { value: 'PreShaped', label: 'Pre-shaped' },
  { value: 'Tumbled', label: 'Tumbled' },
  { value: 'Polished', label: 'Polished' },
  { value: 'Mixed', label: 'Mixed conditions' },
];

const SIZE_CATEGORIES: { value: SizeCategory; label: string }[] = [
  { value: 'ZeroToOne', label: '0 - 1"' },
  { value: 'OneToTwo', label: '1" - 2"' },
  { value: 'TwoToThree', label: '2" - 3"' },
  { value: 'ThreeToFour', label: '3" - 4"' },
  { value: 'FourToFive', label: '4" - 5"' },
  { value: 'GreaterThanFive', label: 'Greater than 5"' },
  { value: 'Assorted', label: 'Assorted' },
];

const STATUS_OPTIONS: { value: InventoryStatus; label: string }[] = [
  { value: 'Available', label: 'Available' },
  { value: 'InUse', label: 'In Use' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Depleted', label: 'Depleted' },
];

const STATUS_COLORS: Record<InventoryStatus, string> = {
  Available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  InUse: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Depleted: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  Partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  acquiredDate: z.string().min(1, 'Acquired date is required'),
  sourceType: z.string().min(1, 'Source type is required'),
  sourceName: z.string().max(255).optional(),
  sourceLocation: z.string().max(255).optional(),
  sourceUrl: z.string().url().max(500).optional().or(z.literal('')),
  totalWeightGrams: z.number().min(0).nullable().optional(),
  remainingWeightGrams: z.number().min(0).nullable().optional(),
  cost: z.coerce.number().min(0).optional(),
  condition: z.string().min(1, 'Condition is required'),
  sizeCategories: z.array(z.string()).optional(),
  qualityRating: z.coerce.number().min(1).max(5).optional(),
  status: z.string().min(1, 'Status is required'),
  storageLocation: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSpecimenItems, setSelectedSpecimenItems] = useState<SpecimenSelection[]>([]);
  const [isAddSpecimenDialogOpen, setIsAddSpecimenDialogOpen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<string>('lb');
  const hasInitializedForm = useRef(false);
  const hasInitializedSpecimens = useRef(false);
  const hasInitializedDisplayUnit = useRef(false);

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
      totalWeightGrams: null,
      remainingWeightGrams: null,
      cost: undefined,
      condition: '',
      sizeCategories: [],
      qualityRating: undefined,
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
        totalWeightGrams: inventory.totalWeightGrams ?? null,
        remainingWeightGrams: inventory.remainingWeightGrams ?? null,
        cost: inventory.cost || undefined,
        condition: inventory.condition,
        sizeCategories: inventory.sizeCategories || [],
        qualityRating: inventory.qualityRating || undefined,
        status: inventory.status,
        storageLocation: inventory.storageLocation || '',
        notes: inventory.notes || '',
        isFavorite: inventory.isFavorite,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time initialization, form.reset is stable
  }, [inventory]);

  // Initialize selected specimens when inventory loads (once only)
  useEffect(() => {
    if (!hasInitializedSpecimens.current && inventory?.specimens) {
      hasInitializedSpecimens.current = true;
      const items: SpecimenSelection[] = inventory.specimens
        .filter(s => s.specimenId || s.userSpecimenId)
        .map(s => ({
          id: (s.specimenId || s.userSpecimenId) as string,
          source: s.source,
        }));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initialization from async data
      setSelectedSpecimenItems(items);
    }
  }, [inventory]);

  // Initialize display unit from inventory (once only)
  useEffect(() => {
    if (!hasInitializedDisplayUnit.current && inventory?.displayUnit) {
      hasInitializedDisplayUnit.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initialization from async data
      setDisplayUnit(inventory.displayUnit);
    }
  }, [inventory]);

  // Handle when a custom specimen is created - add it to the selection
  const handleCustomSpecimenCreated = (specimenId: string) => {
    setSelectedSpecimenItems(prev => [...prev, { id: specimenId, source: 'user' }]);
  };

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate({
      id,
      data: {
        name: data.name,
        acquiredDate: data.acquiredDate,
        sourceType: data.sourceType as SourceType,
        sourceName: data.sourceName || undefined,
        sourceLocation: data.sourceLocation || undefined,
        sourceUrl: data.sourceUrl || undefined,
        totalWeightGrams: data.totalWeightGrams ?? undefined,
        remainingWeightGrams: data.remainingWeightGrams ?? undefined,
        displayUnit: data.totalWeightGrams || data.remainingWeightGrams ? displayUnit : undefined,
        cost: data.cost,
        condition: data.condition as InventoryCondition,
        sizeCategories: data.sizeCategories && data.sizeCategories.length > 0
          ? data.sizeCategories as SizeCategory[]
          : undefined,
        qualityRating: data.qualityRating,
        status: data.status as InventoryStatus,
        storageLocation: data.storageLocation || undefined,
        notes: data.notes || undefined,
        isFavorite: data.isFavorite,
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
            Acquired {new Date(inventory.acquiredDate).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="secondary" className={STATUS_COLORS[inventory.status]}>
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
                          {SOURCE_TYPES.map(({ value, label }) => (
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

              <FormItem>
                <FormLabel>Specimens</FormLabel>
                <SpecimenMultiSelect
                  selectedItems={selectedSpecimenItems}
                  onSelectionChange={setSelectedSpecimenItems}
                  placeholder="Select rock/mineral types..."
                  onAddCustom={() => setIsAddSpecimenDialogOpen(true)}
                />
                <FormDescription>
                  What types of rocks are in this batch?
                </FormDescription>
              </FormItem>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalWeightGrams"
                  render={({ field }) => (
                    <FormItem>
                      <WeightInput
                        label="Total Weight"
                        valueGrams={field.value ?? null}
                        onValueChange={(grams, unit) => {
                          field.onChange(grams);
                          if (unit) setDisplayUnit(unit);
                        }}
                        initialDisplayUnit={inventory?.displayUnit}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONDITIONS.map(({ value, label }) => (
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
                  name="qualityRating"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        label="Quality"
                        value={field.value ?? null}
                        onChange={(val) => field.onChange(val ?? undefined)}
                        size="md"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sizeCategories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size Categories</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 border rounded-md">
                      {SIZE_CATEGORIES.map(({ value, label }) => (
                        <div key={value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`size-${value}`}
                            checked={field.value?.includes(value) ?? false}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value ?? [];
                              if (checked) {
                                field.onChange([...currentValues, value]);
                              } else {
                                field.onChange(currentValues.filter((v: string) => v !== value));
                              }
                            }}
                          />
                          <label
                            htmlFor={`size-${value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormDescription>Select all sizes that apply to this batch</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="remainingWeightGrams"
                  render={({ field }) => (
                    <FormItem>
                      <WeightInput
                        label="Remaining Weight"
                        valueGrams={field.value ?? null}
                        onValueChange={(grams, unit) => {
                          field.onChange(grams);
                          if (unit) setDisplayUnit(unit);
                        }}
                        initialDisplayUnit={inventory?.displayUnit}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
