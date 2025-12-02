'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cycleApi, tumblerApi, userApi } from '@/lib/api';
import { useSpecimens } from '@/hooks/use-specimens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SpecimenMultiSelect } from '@/components/specimen-multi-select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  startDate: z.string().min(1, 'Start date is required'),
  additionalSpecimens: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCyclePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSpecimenIds, setSelectedSpecimenIds] = useState<string[]>([]);
  const [specimenError, setSpecimenError] = useState<string | null>(null);

  const { data: tumblers } = useQuery({
    queryKey: ['tumblers'],
    queryFn: tumblerApi.getAll,
  });

  const { data: specimens = [], isLoading: specimensLoading } = useSpecimens();

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userApi.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      additionalSpecimens: '',
      notes: '',
    },
  });

  // Get selected specimens for cycle name generation
  const selectedSpecimens = useMemo(() => {
    return specimens.filter((s) => selectedSpecimenIds.includes(s.id));
  }, [specimens, selectedSpecimenIds]);

  // Watch start date for cycle name auto-population
  const watchedStartDate = form.watch('startDate');

  // Auto-populate cycle name based on selected specimens and start date
  useEffect(() => {
    if (!watchedStartDate) return;

    // Format date based on user settings
    const formatDate = (dateStr: string, format: string) => {
      const date = new Date(dateStr);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();

      switch (format) {
        case 'DDMMYYYY':
          return `${day}/${month}/${year}`;
        case 'YYYYMMDD':
          return `${year}-${month}-${day}`;
        case 'MMDDYYYY':
        default:
          return `${month}/${day}/${year}`;
      }
    };

    const dateFormat = userSettings?.dateFormat || 'MMDDYYYY';
    const formattedDate = formatDate(watchedStartDate, dateFormat);

    // Build cycle name from selected specimens
    const specimenNames = selectedSpecimens
      .slice(0, 3) // Limit to first 3 specimens to keep name reasonable
      .map((s) => s.commonName)
      .join(', ');

    const suffix = selectedSpecimens.length > 3 ? ` +${selectedSpecimens.length - 3} more` : '';
    const specimenPart = specimenNames ? `${specimenNames}${suffix}` : 'New Cycle';

    form.setValue('name', `${specimenPart} - ${formattedDate}`);
  }, [selectedSpecimens, watchedStartDate, form, userSettings?.dateFormat]);

  const createMutation = useMutation({
    mutationFn: cycleApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      toast.success('Cycle created successfully');
      router.push(`/cycles/${data.id}`);
    },
    onError: () => {
      toast.error('Failed to create cycle');
    },
  });

  const onSubmit = (data: FormValues) => {
    // Validate that at least one specimen source is provided
    const hasSelectedSpecimens = selectedSpecimenIds.length > 0;
    const hasAdditionalSpecimens = data.additionalSpecimens && data.additionalSpecimens.trim().length > 0;

    if (!hasSelectedSpecimens && !hasAdditionalSpecimens) {
      setSpecimenError('Please select specimens from the list or add other specimens');
      return;
    }

    setSpecimenError(null);
    createMutation.mutate({
      name: data.name,
      startDate: data.startDate,
      additionalSpecimens: data.additionalSpecimens || undefined,
      notes: data.notes || undefined,
      specimenIds: selectedSpecimenIds.length > 0 ? selectedSpecimenIds : undefined,
    });
  };

  const hasTumblers = tumblers && tumblers.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cycles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Start New Cycle</h1>
          <p className="text-muted-foreground">Begin tracking a new tumbling cycle</p>
        </div>
      </div>

      {!hasTumblers && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">
              You need to add a tumbler before starting a cycle.{' '}
              <Link href="/tumblers/new" className="font-medium underline">
                Add a tumbler first
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cycle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-helpful-tip">
                      The date your first tumbling stage begins
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Rocks/Specimens *</FormLabel>
                <SpecimenMultiSelect
                  specimens={specimens}
                  selectedIds={selectedSpecimenIds}
                  onSelectionChange={(ids) => {
                    setSelectedSpecimenIds(ids);
                    if (ids.length > 0) setSpecimenError(null);
                  }}
                  placeholder="Select specimens from the list..."
                  isLoading={specimensLoading}
                />
                <FormDescription className="text-helpful-tip">
                  Select the types of rocks you're tumbling. Search by name, alias, variety, or family.
                </FormDescription>
                {specimenError && (
                  <p className="text-sm font-medium text-destructive">{specimenError}</p>
                )}
              </FormItem>

              <FormField
                control={form.control}
                name="additionalSpecimens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Specimens *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specimens not in the list above..."
                        className="min-h-[60px]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.trim()) setSpecimenError(null);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Add any additional rocks not found in the dropdown
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
                    <FormLabel>Cycle Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Beach Agates Batch 1" {...field} />
                    </FormControl>
                    <FormDescription className="text-helpful-tip">
                      A descriptive name to identify this batch
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
                        placeholder="Any additional notes about this cycle..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                <Button type="submit" disabled={createMutation.isPending || !hasTumblers}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Start Cycle
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
