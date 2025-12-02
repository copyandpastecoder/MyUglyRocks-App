'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useEffect } from 'react';
import { tumblerApi } from '@/lib/api';
import { useTumblerModels } from '@/hooks';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Brands that allow user-editable motor capacity (per ADR-001)
const EDITABLE_CAPACITY_BRANDS = ['Generic', 'Other', 'DIY', 'MJR Tumblers'];

const formSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  tumblerType: z.enum(['Rotary', 'Vibratory']),
  motorCapacityLbs: z.coerce.number().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
  barrelCount: z.coerce.number().min(1).max(10),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTumblerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      brand: '',
      model: '',
      tumblerType: 'Rotary',
      notes: '',
      barrelCount: 1,
    },
  });

  // Fetch tumbler models for dropdowns
  const { data: models = [], isLoading: modelsLoading } = useTumblerModels();

  // Get unique brands sorted
  const brands = useMemo(() =>
    [...new Set(models.map(m => m.brand))].sort(),
    [models]
  );

  // Watch form values for cascading logic
  const selectedBrand = form.watch('brand');
  const selectedModelName = form.watch('model');

  // Get models for selected brand
  const modelsForBrand = useMemo(() =>
    models.filter(m => m.brand === selectedBrand),
    [models, selectedBrand]
  );

  // Get full model object for auto-population
  const selectedModel = useMemo(() =>
    models.find(m => m.brand === selectedBrand && m.model === selectedModelName),
    [models, selectedBrand, selectedModelName]
  );

  // Motor capacity editability logic (per ADR-001)
  const isCapacityEditable = EDITABLE_CAPACITY_BRANDS.includes(selectedBrand);
  const maxCapacity = selectedBrand === 'MJR Tumblers' ? 50 : 100;

  // Auto-select model when brand has only one option
  useEffect(() => {
    if (modelsForBrand.length === 1) {
      form.setValue('model', modelsForBrand[0].model);
    } else if (selectedBrand && modelsForBrand.length > 1) {
      // Reset model when brand changes to one with multiple models
      form.setValue('model', '');
    }
  }, [selectedBrand, modelsForBrand, form]);

  // Auto-populate fields when model is selected
  useEffect(() => {
    if (selectedModel) {
      form.setValue('tumblerType', selectedModel.tumblerType as 'Rotary' | 'Vibratory');
      form.setValue('barrelCount', selectedModel.defaultBarrelCount);
      if (selectedModel.motorCapacityLbs) {
        form.setValue('motorCapacityLbs', selectedModel.motorCapacityLbs);
      }
    }
  }, [selectedModel, form]);

  const createMutation = useMutation({
    mutationFn: tumblerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumblers'] });
      toast.success('Tumbler created successfully');
      router.push('/tumblers');
    },
    onError: () => {
      toast.error('Failed to create tumbler');
    },
  });

  const onSubmit = (data: FormValues) => {
    const barrels = Array.from({ length: data.barrelCount }, (_, i) => ({
      barrelNumber: i + 1,
    }));

    // Only include motorCapacityLbs for editable-capacity brands
    const includeCapacity = EDITABLE_CAPACITY_BRANDS.includes(data.brand);

    createMutation.mutate({
      brand: data.brand,
      model: data.model || undefined,
      tumblerType: data.tumblerType,
      motorCapacityLbs: includeCapacity ? data.motorCapacityLbs : undefined,
      notes: data.notes || undefined,
      barrels,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tumblers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Tumbler</h1>
          <p className="text-muted-foreground">Add a new rock tumbler to your collection</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tumbler Details</CardTitle>
          <CardDescription>
            Enter the details of your rock tumbler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={modelsLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={modelsLoading ? "Loading..." : "Select brand"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedBrand || modelsForBrand.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedBrand ? "Select model" : "Select brand first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelsForBrand.map(m => (
                          <SelectItem key={m.id} value={m.model}>{m.model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tumblerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} disabled>
                      <FormControl>
                        <SelectTrigger className="bg-muted">
                          <SelectValue placeholder="Auto-populated from model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Rotary">Rotary</SelectItem>
                        <SelectItem value="Vibratory">Vibratory</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Auto-populated from selected model
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barrelCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Barrels *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={10} {...field} />
                    </FormControl>
                    <FormDescription>
                      Auto-populated from model, but you can adjust
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorCapacityLbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Motor Capacity (lbs) {isCapacityEditable ? '*' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={maxCapacity}
                        {...field}
                        value={field.value ?? ''}
                        disabled={!isCapacityEditable}
                        className={!isCapacityEditable ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormDescription>
                      {isCapacityEditable
                        ? `Enter motor capacity (max ${maxCapacity} lbs)`
                        : 'Set by manufacturer specs'}
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
                        placeholder="Any additional notes about this tumbler..."
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Tumbler
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
