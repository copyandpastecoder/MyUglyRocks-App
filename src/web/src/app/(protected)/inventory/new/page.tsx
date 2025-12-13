'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInventory } from '@/hooks/use-inventory';
import { useSpecimens } from '@/hooks/use-specimens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SpecimenMultiSelect, type SpecimenSelection } from '@/components/specimen-multi-select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { SourceType, InventoryCondition, SizeCategory } from '@/types/inventory';

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
  displayUnit: z.string().default('g'),
  cost: z.coerce.number().min(0).optional(),
  condition: z.string().min(1, 'Condition is required'),
  sizeCategory: z.string().optional(),
  qualityRating: z.coerce.number().min(1).max(5).optional(),
  storageLocation: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// Conversion helpers
function toGrams(value: number, unit: string): number {
  switch (unit) {
    case 'oz': return value * 28.3495;
    case 'lb': return value * 453.592;
    default: return value;
  }
}

export default function NewInventoryPage() {
  const router = useRouter();
  const [selectedSpecimenItems, setSelectedSpecimenItems] = useState<SpecimenSelection[]>([]);

  const { data: specimens = [], isLoading: specimensLoading } = useSpecimens();
  const createMutation = useCreateInventory();

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type inference limitation
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      acquiredDate: new Date().toISOString().split('T')[0],
      sourceType: 'Store',
      sourceName: '',
      sourceLocation: '',
      sourceUrl: '',
      totalWeight: undefined,
      displayUnit: 'lb',
      cost: undefined,
      condition: 'Raw',
      sizeCategory: '',
      qualityRating: undefined,
      storageLocation: '',
      notes: '',
      isFavorite: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    const totalWeightGrams = data.totalWeight ? toGrams(data.totalWeight, data.displayUnit) : undefined;

    createMutation.mutate({
      name: data.name,
      acquiredDate: data.acquiredDate,
      sourceType: data.sourceType as SourceType,
      sourceName: data.sourceName || undefined,
      sourceLocation: data.sourceLocation || undefined,
      sourceUrl: data.sourceUrl || undefined,
      totalWeightGrams,
      remainingWeightGrams: totalWeightGrams,
      displayUnit: data.displayUnit,
      cost: data.cost,
      condition: data.condition as InventoryCondition,
      sizeCategory: data.sizeCategory as SizeCategory || undefined,
      qualityRating: data.qualityRating,
      storageLocation: data.storageLocation || undefined,
      notes: data.notes || undefined,
      isFavorite: data.isFavorite,
      specimens: selectedSpecimenItems.map(item => ({ specimenId: item.id })),
    }, {
      onSuccess: (inventory) => {
        router.push(`/inventory/${inventory.inventoryId}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Inventory</h1>
          <p className="text-muted-foreground">Track a new rock acquisition</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acquisition Details</CardTitle>
        </CardHeader>
        <CardContent>
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
                        <Input placeholder="e.g., Lake Superior Agates Batch 1" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this acquisition
                      </FormDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormLabel>Source Name</FormLabel>
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
                        <Input type="url" placeholder="https://..." {...field} />
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
                />
                <FormDescription>
                  What types of rocks are in this batch?
                </FormDescription>
              </FormItem>

              <div className="grid gap-6 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="totalWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Weight</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="0" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input type="number" min="1" max="5" placeholder="1-5" {...field} />
                      </FormControl>
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

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Inventory
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
