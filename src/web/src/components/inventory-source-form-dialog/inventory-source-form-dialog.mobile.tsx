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
import type { InventorySourceType } from '@/types/inventory-source';
import { sourceTypeDisplayNames, sourceTypeDescriptions } from '@/types/inventory-source';
import type { InventorySourceFormDialogProps } from './types';

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

export function InventorySourceFormDialogMobile({
  open,
  onOpenChange,
  source,
  onSuccess,
}: InventorySourceFormDialogProps) {
  const isEditing = !!source;

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
    if (!name.trim()) return;

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
      // Silently fail
    }
  };

  const handleNameBlur = () => {
    const name = form.getValues('name');
    const sourceType = form.getValues('sourceType');

    if (name && name.length >= 1 && name.length <= 100) {
      validateNameUniqueness(name, sourceType);
    }
  };

  const handleSourceTypeChange = (newType: string) => {
    const name = form.getValues('name');

    form.clearErrors('name');

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>{isEditing ? 'Edit Source' : 'Add Source'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the details of this acquisition source.'
              : 'Add a new source where you acquire specimens.'}
          </SheetDescription>
        </SheetHeader>

        {isEditing && isLoadingDetails ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <Form {...form}>
                <form id="source-form-mobile" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="sourceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleSourceTypeChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Select a source type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOURCE_TYPES.map((type) => (
                              <SelectItem key={type} value={type} className="py-3">
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
                        <FormLabel className="text-base font-semibold">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Arizona Rock Shop"
                            className="h-12 text-base"
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
                        <FormLabel className="text-base font-semibold">Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Phoenix, AZ"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., (555) 123-4567"
                            type="tel"
                            className="h-12 text-base"
                            {...field}
                          />
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
                        <FormLabel className="text-base font-semibold">Contact Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., John Smith"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Website</FormLabel>
                        <FormControl>
                          <UrlInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="https://example.com"
                            className="h-12 text-base"
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
                        <FormLabel className="text-base font-semibold">Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about this source..."
                            className="resize-none text-base min-h-[100px]"
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
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold">Active</FormLabel>
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
                </form>
              </Form>
            </div>

            <SheetFooter className="p-4 border-t bg-background">
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  className="flex-1 h-12 text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="source-form-mobile"
                  disabled={isPending}
                  className="flex-1 h-12 text-base"
                >
                  {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isEditing ? 'Save' : 'Create'}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
