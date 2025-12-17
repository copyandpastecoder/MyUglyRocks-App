'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateInventorySource,
  useUpdateInventorySource,
  useInventorySource,
  useCheckSourceName,
} from '@/hooks/use-inventory-sources';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UrlInput } from '@/components/ui/url-input';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { InventorySourceListDto, InventorySourceType } from '@/types/inventory-source';
import { sourceTypeDisplayNames, sourceTypeDescriptions } from '@/types/inventory-source';

const SOURCE_TYPES: InventorySourceType[] = ['Store', 'Online', 'Found', 'Contact', 'GemShow', 'Other'];

const formSchema = z.object({
  sourceType: z.enum(['Store', 'Online', 'Found', 'Contact', 'GemShow', 'Other'] as const),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  location: z.string().max(200, 'Location must be 200 characters or less').optional(),
  phone: z.string().max(50, 'Phone must be 50 characters or less').optional(),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contactName: z.string().max(100, 'Contact name must be 100 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InventorySourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: InventorySourceListDto | null;
  onSuccess?: (sourceId: string) => void;
}

export function InventorySourceFormDialog({
  open,
  onOpenChange,
  source,
  onSuccess,
}: InventorySourceFormDialogProps) {
  const isEditing = !!source;

  // Fetch full source details when editing
  const { data: sourceDetails, isLoading: isLoadingDetails } = useInventorySource(
    isEditing ? source.inventorySourceId : null
  );

  const createMutation = useCreateInventorySource();
  const updateMutation = useUpdateInventorySource();
  const checkNameMutation = useCheckSourceName();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'Store',
      name: '',
      location: '',
      phone: '',
      url: '',
      contactName: '',
      notes: '',
      isActive: true,
    },
  });

  // Reset form when dialog opens/closes or source changes
  useEffect(() => {
    if (open) {
      if (sourceDetails) {
        form.reset({
          sourceType: sourceDetails.sourceType,
          name: sourceDetails.name,
          location: sourceDetails.location || '',
          phone: sourceDetails.phone || '',
          url: sourceDetails.url || '',
          contactName: sourceDetails.contactName || '',
          notes: sourceDetails.notes || '',
          isActive: sourceDetails.isActive,
        });
      } else if (!isEditing) {
        form.reset({
          sourceType: 'Store',
          name: '',
          location: '',
          phone: '',
          url: '',
          contactName: '',
          notes: '',
          isActive: true,
        });
      }
    }
  }, [open, sourceDetails, isEditing, form]);

  const validateNameUniqueness = async (name: string, sourceType: string) => {
    if (!name.trim()) return; // Skip if name is empty

    try {
      const result = await checkNameMutation.mutateAsync({
        sourceType,
        name: name.trim(),
        excludeSourceId: isEditing ? source?.inventorySourceId : undefined,
      });

      if (result.exists) {
        form.setError('name', {
          type: 'manual',
          message: 'A source with this name and type already exists',
        });
      }
    } catch {
      // Silently fail - validation will happen on submit anyway
    }
  };

  const handleNameBlur = () => {
    const name = form.getValues('name');
    const sourceType = form.getValues('sourceType');

    // Only validate if name passes basic validation
    if (name && name.length >= 1 && name.length <= 100) {
      validateNameUniqueness(name, sourceType);
    }
  };

  const handleSourceTypeChange = (newType: string) => {
    const name = form.getValues('name');

    // Clear any existing name error since we're changing the type
    form.clearErrors('name');

    // Re-validate uniqueness if name is filled
    if (name && name.length >= 1 && name.length <= 100) {
      validateNameUniqueness(name, newType);
    }
  };

  const onSubmit = (values: FormValues) => {
    const data = {
      sourceType: values.sourceType,
      name: values.name,
      location: values.location || undefined,
      phone: values.phone || undefined,
      url: values.url || undefined,
      contactName: values.contactName || undefined,
      notes: values.notes || undefined,
      isActive: values.isActive,
    };

    if (isEditing && source) {
      updateMutation.mutate(
        { id: source.inventorySourceId, data },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newSource) => {
          onOpenChange(false);
          onSuccess?.(newSource.inventorySourceId);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Source' : 'Add Source'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this acquisition source.'
              : 'Add a new source where you acquire specimens.'}
          </DialogDescription>
        </DialogHeader>

        {isEditing && isLoadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="sourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleSourceTypeChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a source type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {sourceTypeDisplayNames[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {sourceTypeDescriptions[field.value]}
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
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Arizona Rock Shop"
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          handleNameBlur();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Phoenix, AZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <UrlInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="https://example.com"
                      />
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
                      <Textarea
                        placeholder="Any additional notes about this source..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive sources won&apos;t appear in the source picker
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
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Save Changes' : 'Create Source'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
