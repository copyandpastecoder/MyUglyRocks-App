'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import type { InventorySourceType } from '@/types/inventory-source';
import { sourceTypeDisplayNames, sourceTypeDescriptions } from '@/types/inventory-source';
import type { InventorySourceFormDialogProps } from './types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { inventorySourceApi } from '@/lib/api';

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

export function InventorySourceFormDialogDesktop({
  open,
  onOpenChange,
  source,
  onSuccess,
}: InventorySourceFormDialogProps) {
  const isEditing = !!source;
  const [aiLookupQuery, setAiLookupQuery] = useState('');
  const [aiLookupLoading, setAiLookupLoading] = useState(false);
  const [aiLookupResult, setAiLookupResult] = useState<{
    success: boolean;
    name?: string;
    url?: string;
    location?: string;
    phone?: string;
    confidenceScore?: number;
    confidenceReason?: string;
  } | null>(null);

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
      // Silently fail - validation will happen on submit anyway
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

    // Clear AI lookup when changing type
    if (newType !== 'Online') {
      setAiLookupQuery('');
      setAiLookupResult(null);
    }
  };

  const handleAILookup = async () => {
    if (!aiLookupQuery.trim()) return;

    setAiLookupLoading(true);
    setAiLookupResult(null);

    try {
      const response = await inventorySourceApi.lookup(aiLookupQuery.trim());
      
      if (response.success && response.data) {
        const mockResult = {
          success: true,
          name: response.data.name,
          url: response.data.url || '',
          location: response.data.location || '',
          phone: response.data.phone || '',
          confidenceScore: response.data.confidenceScore,
          confidenceReason: response.data.confidenceReason || undefined,
        };

        setAiLookupResult(mockResult);
        
        // Auto-populate fields if successful
        form.setValue('name', response.data.name);
        if (response.data.url) form.setValue('url', response.data.url);
        if (response.data.location) form.setValue('location', response.data.location);
        if (response.data.phone) form.setValue('phone', response.data.phone);
        if (response.data.contactName) form.setValue('contactName', response.data.contactName);
      } else {
        setAiLookupResult({
          success: false,
        });
      }
    } catch (error) {
      console.error('AI lookup error:', error);
      setAiLookupResult({
        success: false,
      });
    } finally {
      setAiLookupLoading(false);
    }
  };

  const handleClearAllInputs = () => {
    form.setValue('name', '');
    form.setValue('url', '');
    form.setValue('location', '');
    form.setValue('phone', '');
    form.setValue('contactName', '');
    setAiLookupResult(null);
    setAiLookupQuery('');
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

              {/* AI Lookup for Online sources */}
              {form.watch('sourceType') === 'Online' && !isEditing && (
                <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm">AI Lookup</h4>
                    </div>
                    {aiLookupResult?.success && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllInputs}
                        className="h-8 text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a company name or website URL to automatically fill in the details
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Arizona Rock Shop or https://example.com"
                      value={aiLookupQuery}
                      onChange={(e) => setAiLookupQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAILookup();
                        }
                      }}
                      disabled={aiLookupLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleAILookup}
                      disabled={!aiLookupQuery.trim() || aiLookupLoading}
                      size="sm"
                    >
                      {aiLookupLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Looking up...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Lookup
                        </>
                      )}
                    </Button>
                  </div>

                  {aiLookupResult && !aiLookupResult.success && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <AlertDescription className="text-sm">
                          Could not find information for this source. Please enter the details manually.
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}

                  {aiLookupResult && aiLookupResult.success && aiLookupResult.confidenceScore !== undefined && (
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <AlertDescription className="text-sm mb-2">
                            Fields populated from AI lookup.
                          </AlertDescription>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                aiLookupResult.confidenceScore >= 80
                                  ? 'default'
                                  : aiLookupResult.confidenceScore >= 50
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {aiLookupResult.confidenceScore}% confidence
                            </Badge>
                            {aiLookupResult.confidenceReason && (
                              <span className="text-xs text-muted-foreground">
                                {aiLookupResult.confidenceReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              )}

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
