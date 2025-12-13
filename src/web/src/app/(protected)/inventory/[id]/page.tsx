'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInventoryItem, useUpdateInventory, useDeleteInventory, useUpdateInventoryStatus } from '@/hooks/use-inventory';
import { useSpecimens } from '@/hooks/use-specimens';
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
import { SpecimenMultiSelect } from '@/components/specimen-multi-select';
import { ArrowLeft, Loader2, Trash2, Package, Star, MapPin, DollarSign, Scale, ExternalLink } from 'lucide-react';
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
  { value: 'Small', label: 'Small (< 0.5")' },
  { value: 'Medium', label: 'Medium (0.5" - 1.5")' },
  { value: 'Large', label: 'Large (> 1.5")' },
  { value: 'Mixed', label: 'Mixed sizes' },
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

const WEIGHT_UNITS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  acquiredDate: z.string().min(1, 'Acquired date is required'),
  sourceType: z.string().min(1, 'Source type is required'),
  sourceName: z.string().max(255).optional(),
  sourceLocation: z.string().max(255).optional(),
  sourceUrl: z.string().url().max(500).optional().or(z.literal('')),
  totalWeight: z.coerce.number().min(0).optional(),
  remainingWeight: z.coerce.number().min(0).optional(),
  displayUnit: z.string().default('g'),
  cost: z.coerce.number().min(0).optional(),
  condition: z.string().min(1, 'Condition is required'),
  sizeCategory: z.string().optional(),
  qualityRating: z.coerce.number().min(1).max(5).optional(),
  status: z.string().min(1, 'Status is required'),
  storageLocation: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

function toGrams(value: number, unit: string): number {
  switch (unit) {
    case 'oz': return value * 28.3495;
    case 'lb': return value * 453.592;
    default: return value;
  }
}

function fromGrams(grams: number, unit: string): number {
  switch (unit) {
    case 'oz': return grams / 28.3495;
    case 'lb': return grams / 453.592;
    default: return grams;
  }
}

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSpecimenIds, setSelectedSpecimenIds] = useState<string[]>([]);

  const { data: inventory, isLoading } = useInventoryItem(id);
  const { data: specimens = [], isLoading: specimensLoading } = useSpecimens();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: inventory ? {
      name: inventory.name,
      acquiredDate: inventory.acquiredDate,
      sourceType: inventory.sourceType,
      sourceName: inventory.sourceName || '',
      sourceLocation: inventory.sourceLocation || '',
      sourceUrl: inventory.sourceUrl || '',
      totalWeight: inventory.totalWeightGrams ? fromGrams(inventory.totalWeightGrams, inventory.displayUnit) : undefined,
      remainingWeight: inventory.remainingWeightGrams ? fromGrams(inventory.remainingWeightGrams, inventory.displayUnit) : undefined,
      displayUnit: inventory.displayUnit,
      cost: inventory.cost || undefined,
      condition: inventory.condition,
      sizeCategory: inventory.sizeCategory || '',
      qualityRating: inventory.qualityRating || undefined,
      status: inventory.status,
      storageLocation: inventory.storageLocation || '',
      notes: inventory.notes || '',
      isFavorite: inventory.isFavorite,
    } : undefined,
  });

  // Initialize selected specimens when inventory loads
  useState(() => {
    if (inventory?.specimens) {
      const ids = inventory.specimens
        .filter(s => s.specimenId)
        .map(s => s.specimenId as string);
      setSelectedSpecimenIds(ids);
    }
  });

  const onSubmit = (data: FormValues) => {
    const totalWeightGrams = data.totalWeight ? toGrams(data.totalWeight, data.displayUnit) : undefined;
    const remainingWeightGrams = data.remainingWeight ? toGrams(data.remainingWeight, data.displayUnit) : undefined;

    updateMutation.mutate({
      id,
      data: {
        name: data.name,
        acquiredDate: data.acquiredDate,
        sourceType: data.sourceType as SourceType,
        sourceName: data.sourceName || undefined,
        sourceLocation: data.sourceLocation || undefined,
        sourceUrl: data.sourceUrl || undefined,
        totalWeightGrams,
        remainingWeightGrams,
        displayUnit: data.displayUnit,
        cost: data.cost,
        condition: data.condition as InventoryCondition,
        sizeCategory: data.sizeCategory as SizeCategory || undefined,
        qualityRating: data.qualityRating,
        status: data.status as InventoryStatus,
        storageLocation: data.storageLocation || undefined,
        notes: data.notes || undefined,
        isFavorite: data.isFavorite,
      },
    }, {
      onSuccess: () => {
        setIsEditing(false);
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

  if (!isEditing) {
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Source Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Source:</span>
                <span>{SOURCE_TYPES.find(s => s.value === inventory.sourceType)?.label}</span>
              </div>
              {inventory.sourceName && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{inventory.sourceName}</span>
                </div>
              )}
              {inventory.sourceLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{inventory.sourceLocation}</span>
                </div>
              )}
              {inventory.sourceUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a href={inventory.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {inventory.sourceUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {inventory.totalWeightGrams && (
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Scale className="h-3 w-3" />
                      Total Weight
                    </div>
                    <p className="font-medium">{fromGrams(inventory.totalWeightGrams, inventory.displayUnit).toFixed(1)} {inventory.displayUnit}</p>
                  </div>
                )}
                {inventory.remainingWeightGrams !== null && (
                  <div>
                    <div className="text-muted-foreground text-sm">Remaining</div>
                    <p className="font-medium">{fromGrams(inventory.remainingWeightGrams, inventory.displayUnit).toFixed(1)} {inventory.displayUnit}</p>
                  </div>
                )}
                {inventory.cost && (
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <DollarSign className="h-3 w-3" />
                      Cost
                    </div>
                    <p className="font-medium">${inventory.cost.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground text-sm">Condition</div>
                  <p className="font-medium">{CONDITIONS.find(c => c.value === inventory.condition)?.label}</p>
                </div>
                {inventory.sizeCategory && (
                  <div>
                    <div className="text-muted-foreground text-sm">Size</div>
                    <p className="font-medium">{SIZE_CATEGORIES.find(s => s.value === inventory.sizeCategory)?.label}</p>
                  </div>
                )}
                {inventory.qualityRating && (
                  <div>
                    <div className="text-muted-foreground text-sm">Quality</div>
                    <p className="font-medium">{inventory.qualityRating}/5</p>
                  </div>
                )}
              </div>
              {inventory.storageLocation && (
                <div>
                  <div className="text-muted-foreground text-sm">Storage Location</div>
                  <p className="font-medium">{inventory.storageLocation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {inventory.specimens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Specimens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {inventory.specimens.map((specimen) => (
                    <Badge key={specimen.inventorySpecimenId} variant="outline">
                      {specimen.commonName}
                      {specimen.estimatedPercentage && ` (${specimen.estimatedPercentage}%)`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {inventory.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{inventory.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-4">
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
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
                Are you sure you want to delete "{inventory.name}"? This action cannot be undone.
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
      </div>
    );
  }

  // Edit mode
  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Inventory</h1>
          <p className="text-muted-foreground">{inventory.name}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acquiredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Acquired *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                      <FormLabel>Source Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="totalWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Weight</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remainingWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remaining Weight</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WEIGHT_UNITS.map(({ value, label }) => (
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
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                  name="sizeCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SIZE_CATEGORIES.map(({ value, label }) => (
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
                      <FormLabel>Quality (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Input {...field} />
                    </FormControl>
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
                      <Textarea className="min-h-[100px]" {...field} />
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
                        Mark this as a favorite
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

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
