'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInventory, useUploadInventoryPhoto } from '@/hooks/use-inventory';
import { useSpecimenSearch } from '@/hooks/use-user-specimens';
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
import { Checkbox } from '@/components/ui/checkbox';
import { SpecimenMultiSelect, type SpecimenSelection } from '@/components/specimen-multi-select';
import { AddCustomSpecimenDialog } from '@/components/add-custom-specimen-dialog';
import { WeightInput } from '@/components/weight-input';
import { StarRating } from '@/components/star-rating';
import { StagedPhotoUpload, type StagedPhoto } from '@/components/staged-photo-upload';
import { SpecimenWeightTable, type SpecimenWithWeight } from '@/components/specimen-weight-table';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
  { value: 'ZeroToOne', label: '0 - 1"' },
  { value: 'OneToTwo', label: '1" - 2"' },
  { value: 'TwoToThree', label: '2" - 3"' },
  { value: 'ThreeToFour', label: '3" - 4"' },
  { value: 'FourToFive', label: '4" - 5"' },
  { value: 'GreaterThanFive', label: 'Greater than 5"' },
  { value: 'Assorted', label: 'Assorted' },
];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  acquiredDate: z.string().min(1, 'Acquired date is required'),
  sourceType: z.string().min(1, 'Source type is required'),
  sourceName: z.string().min(1, 'Source name is required').max(255),
  sourceLocation: z.string().max(255).optional(),
  sourceUrl: z.string().url().max(500).optional().or(z.literal('')),
  totalWeightGrams: z.number().min(0).nullable().optional(),
  cost: z.coerce.number().min(0).optional(),
  condition: z.string().min(1, 'Condition is required'),
  sizeCategories: z.array(z.string()).optional(),
  qualityRating: z.coerce.number().min(1).max(5).optional(),
  storageLocation: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewInventoryPage() {
  const router = useRouter();
  const [selectedSpecimenItems, setSelectedSpecimenItems] = useState<SpecimenSelection[]>([]);
  const [specimenError, setSpecimenError] = useState<string | null>(null);
  const [isAddSpecimenDialogOpen, setIsAddSpecimenDialogOpen] = useState(false);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<string>('lb');
  const [trackIndividualWeights, setTrackIndividualWeights] = useState(false);
  const [specimensWithWeights, setSpecimensWithWeights] = useState<SpecimenWithWeight[]>([]);

  // Use specimen search to get specimen names for auto-populating the name field
  const { data: allSpecimens = [] } = useSpecimenSearch();
  const createMutation = useCreateInventory();
  const uploadPhotoMutation = useUploadInventoryPhoto();

  // Handle when a custom specimen is created - add it to the selection
  const handleCustomSpecimenCreated = (specimenId: string) => {
    setSelectedSpecimenItems(prev => [...prev, { id: specimenId, source: 'user' }]);
  };

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
      totalWeightGrams: null,
      cost: undefined,
      condition: 'Raw',
      sizeCategories: [],
      qualityRating: undefined,
      storageLocation: '',
      notes: '',
      isFavorite: false,
    },
  });

  // Watch fields for auto-populating name
  const sourceName = form.watch('sourceName');
  const acquiredDate = form.watch('acquiredDate');

  // Auto-populate name based on SourceName, Specimens, and Date
  useEffect(() => {
    const parts: string[] = [];

    if (sourceName?.trim()) {
      parts.push(sourceName.trim());
    }

    // Get specimen names from either mode
    let specimenNames: string[] = [];
    if (trackIndividualWeights) {
      specimenNames = specimensWithWeights.map(s => s.commonName);
    } else if (selectedSpecimenItems.length > 0 && allSpecimens.length > 0) {
      specimenNames = selectedSpecimenItems
        .map(sel => allSpecimens.find(s => s.id === sel.id)?.commonName)
        .filter(Boolean) as string[];
    }

    if (specimenNames.length > 0) {
      // Show first 3, then "& more" if there are more than 3
      const displayNames = specimenNames.slice(0, 3).join(', ');
      const specimenNamesStr = specimenNames.length > 3
        ? `${displayNames} & more`
        : displayNames;
      parts.push(specimenNamesStr);
    }

    if (acquiredDate) {
      const date = new Date(acquiredDate);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      parts.push(formattedDate);
    }

    if (parts.length > 0) {
      form.setValue('name', parts.join(' - '));
    }
  }, [sourceName, selectedSpecimenItems, specimensWithWeights, trackIndividualWeights, acquiredDate, allSpecimens, form]);

  const onSubmit = async (data: FormValues) => {
    // Validate specimens based on mode
    if (trackIndividualWeights) {
      if (specimensWithWeights.length === 0) {
        setSpecimenError('At least one specimen is required');
        return;
      }
    } else {
      if (selectedSpecimenItems.length === 0) {
        setSpecimenError('At least one specimen is required');
        return;
      }
    }
    setSpecimenError(null);
    setIsSubmitting(true);

    // Calculate total weight based on mode
    let totalWeightGrams: number | undefined;
    let specimensPayload;

    if (trackIndividualWeights) {
      // Use individual specimen weights
      specimensPayload = specimensWithWeights.map(s => ({
        specimenId: s.specimenId,
        userSpecimenId: s.userSpecimenId,
        weightGrams: s.weightGrams ?? undefined,
      }));
      // Total will be calculated server-side from specimen weights
      totalWeightGrams = specimensWithWeights
        .filter(s => s.weightGrams != null)
        .reduce((sum, s) => sum + (s.weightGrams || 0), 0) || undefined;
    } else {
      // Use single total weight
      totalWeightGrams = data.totalWeightGrams ?? undefined;
      specimensPayload = selectedSpecimenItems.map(item => ({
        specimenId: item.source === 'system' ? item.id : undefined,
        userSpecimenId: item.source === 'user' ? item.id : undefined,
      }));
    }

    try {
      const inventory = await createMutation.mutateAsync({
        name: data.name,
        acquiredDate: data.acquiredDate,
        sourceType: data.sourceType as SourceType,
        sourceName: data.sourceName || undefined,
        sourceLocation: data.sourceLocation || undefined,
        sourceUrl: data.sourceUrl || undefined,
        totalWeightGrams,
        remainingWeightGrams: totalWeightGrams,
        displayUnit: totalWeightGrams ? displayUnit : undefined,
        cost: data.cost,
        condition: data.condition as InventoryCondition,
        sizeCategories: data.sizeCategories && data.sizeCategories.length > 0
          ? data.sizeCategories as SizeCategory[]
          : undefined,
        qualityRating: data.qualityRating,
        storageLocation: data.storageLocation || undefined,
        notes: data.notes || undefined,
        isFavorite: data.isFavorite,
        specimens: specimensPayload,
      });

      // Upload photos if any
      if (stagedPhotos.length > 0) {
        toast.info(`Uploading ${stagedPhotos.length} photo${stagedPhotos.length > 1 ? 's' : ''}...`);

        for (let i = 0; i < stagedPhotos.length; i++) {
          const photo = stagedPhotos[i];
          try {
            await uploadPhotoMutation.mutateAsync({
              inventoryId: inventory.inventoryId,
              file: photo.file,
              isCover: i === 0, // First photo is cover
            });
          } catch {
            toast.error(`Failed to upload photo ${i + 1}`);
          }
        }
      }

      router.push(`/inventory/${inventory.inventoryId}`);
    } catch {
      // Error already handled by mutation
    } finally {
      setIsSubmitting(false);
    }
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

              {/* Toggle for individual weight tracking */}
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Track Weight Per Specimen</label>
                  <p className="text-sm text-muted-foreground">
                    Enter individual weights for each specimen type instead of a total weight
                  </p>
                </div>
                <Switch
                  checked={trackIndividualWeights}
                  onCheckedChange={(checked) => {
                    setTrackIndividualWeights(checked);
                    // Clear both forms when switching modes
                    if (checked) {
                      setSelectedSpecimenItems([]);
                      form.setValue('totalWeightGrams', null);
                    } else {
                      setSpecimensWithWeights([]);
                    }
                    setSpecimenError(null);
                  }}
                />
              </div>

              {trackIndividualWeights ? (
                <>
                  <SpecimenWeightTable
                    specimens={specimensWithWeights}
                    onSpecimensChange={(specimens) => {
                      setSpecimensWithWeights(specimens);
                      if (specimens.length > 0) {
                        setSpecimenError(null);
                      }
                    }}
                    onAddCustom={() => setIsAddSpecimenDialogOpen(true)}
                  />
                  {specimenError && (
                    <p className="text-sm font-medium text-destructive">{specimenError}</p>
                  )}
                </>
              ) : (
                <>
                  <FormItem>
                    <FormLabel>Specimens *</FormLabel>
                    <SpecimenMultiSelect
                      selectedItems={selectedSpecimenItems}
                      onSelectionChange={(items) => {
                        setSelectedSpecimenItems(items);
                        if (items.length > 0) {
                          setSpecimenError(null);
                        }
                      }}
                      placeholder="Select rock/mineral types..."
                      onAddCustom={() => setIsAddSpecimenDialogOpen(true)}
                    />
                    <FormDescription>
                      What types of rocks are in this batch?
                    </FormDescription>
                    {specimenError && (
                      <p className="text-sm font-medium text-destructive">{specimenError}</p>
                    )}
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
                </>
              )}

              {/* Cost field when in individual weight mode */}
              {trackIndividualWeights && (
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-6 sm:grid-cols-2">
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
                      Auto-generated from Source Name, Specimens, and Date (you can edit)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Photo Upload */}
      <StagedPhotoUpload
        photos={stagedPhotos}
        onChange={setStagedPhotos}
        maxPhotos={10}
      />

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isSubmitting ? 'Creating...' : 'Add Inventory'}
        </Button>
      </div>

      {/* Add Custom Specimen Dialog */}
      <AddCustomSpecimenDialog
        open={isAddSpecimenDialogOpen}
        onOpenChange={setIsAddSpecimenDialogOpen}
        onSuccess={handleCustomSpecimenCreated}
      />
    </div>
  );
}
