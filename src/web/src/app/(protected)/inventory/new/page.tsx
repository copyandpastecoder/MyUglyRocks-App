'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInventory, useUploadInventoryPhoto } from '@/hooks/use-inventory';
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
import { AddCustomSpecimenDialog, type CustomSpecimenCreatedData } from '@/components/add-custom-specimen-dialog';
import { StagedPhotoUpload, type StagedPhoto } from '@/components/staged-photo-upload';
import { SpecimenRowList, type SpecimenRowItem } from '@/components/specimen-row-list';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { SourceType } from '@/types/inventory';
import { SOURCE_TYPE_OPTIONS } from '@/lib/inventory-constants';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  acquiredDate: z.string().min(1, 'Acquired date is required'),
  sourceType: z.string().min(1, 'Source type is required'),
  sourceName: z.string().min(1, 'Source name is required').max(255),
  sourceLocation: z.string().max(255).optional(),
  sourceUrl: z.string().url().max(500).optional().or(z.literal('')),
  storageLocation: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewInventoryPage() {
  const router = useRouter();
  const [specimenRows, setSpecimenRows] = useState<SpecimenRowItem[]>([]);
  const [specimenError, setSpecimenError] = useState<string | null>(null);
  const [isAddSpecimenDialogOpen, setIsAddSpecimenDialogOpen] = useState(false);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateInventory();
  const uploadPhotoMutation = useUploadInventoryPhoto();

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

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type inference limitation
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      acquiredDate: new Date().toISOString().split('T')[0],
      sourceType: '',
      sourceName: '',
      sourceLocation: '',
      sourceUrl: '',
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

    // Get specimen names from rows
    const specimenNames = specimenRows
      .filter(r => r.commonName)
      .map(r => r.commonName);

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
  }, [sourceName, specimenRows, acquiredDate, form]);

  const onSubmit = async (data: FormValues) => {
    // Validate specimens
    const validSpecimens = specimenRows.filter(r => r.selectedId);
    if (validSpecimens.length === 0) {
      setSpecimenError('At least one specimen is required');
      return;
    }
    setSpecimenError(null);
    setIsSubmitting(true);

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

    try {
      const inventory = await createMutation.mutateAsync({
        name: data.name,
        acquiredDate: data.acquiredDate,
        sourceType: data.sourceType as SourceType,
        sourceName: data.sourceName || undefined,
        sourceLocation: data.sourceLocation || undefined,
        sourceUrl: data.sourceUrl || undefined,
        displayUnit: 'lb',
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

      toast.success('Inventory added successfully');
      router.push('/inventory');
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source type..." />
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
