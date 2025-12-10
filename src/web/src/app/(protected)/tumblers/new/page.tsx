'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { tumblerApi } from '@/lib/api';
import { useTumblerModels, useBarrelNicknames } from '@/hooks';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Brands that allow user-editable motor capacity (per ADR-001)
const EDITABLE_CAPACITY_BRANDS = ['Generic', 'Other', 'DIY', 'MJR Tumblers'];

// UUID helper with fallback for older browsers
function generateUUID(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for browsers where randomUUID is not available
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}

// Local barrel type for managing barrels before tumbler creation
interface LocalBarrel {
  id: string; // Temporary ID for React key
  barrelNumber: number;
  nickname?: string;
  capacityLbs?: number;
}

const formSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  tumblerType: z.enum(['Rotary', 'Vibratory']),
  motorCapacityLbs: z.coerce.number().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTumblerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch barrel nicknames for random assignment
  const { data: barrelNicknames = [] } = useBarrelNicknames();

  // Helper to generate random nickname
  const getRandomNickname = useCallback(() => {
    if (barrelNicknames.length === 0) return undefined;
    return barrelNicknames[Math.floor(Math.random() * barrelNicknames.length)];
  }, [barrelNicknames]);

  // Local barrel state
  const [barrels, setBarrels] = useState<LocalBarrel[]>([
    { id: generateUUID(), barrelNumber: 1 }
  ]);
  const [editingBarrel, setEditingBarrel] = useState<LocalBarrel | null>(null);
  const [barrelNickname, setBarrelNickname] = useState('');
  const [barrelCapacity, setBarrelCapacity] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      brand: '',
      model: '',
      tumblerType: 'Rotary',
      notes: '',
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
      if (selectedModel.motorCapacityLbs) {
        form.setValue('motorCapacityLbs', selectedModel.motorCapacityLbs);
      }
      // Create barrels based on model's default barrel count
      const newBarrels: LocalBarrel[] = Array.from(
        { length: selectedModel.defaultBarrelCount },
        (_, i) => ({
          id: generateUUID(),
          barrelNumber: i + 1,
          nickname: getRandomNickname(),
          capacityLbs: selectedModel.defaultCapacityLbs ?? undefined,
        })
      );
      setBarrels(newBarrels);
    }
  }, [selectedModel, form, getRandomNickname]);

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

  // Barrel management functions
  const handleAddBarrel = () => {
    const nextNumber = Math.max(...barrels.map(b => b.barrelNumber), 0) + 1;
    setBarrels([...barrels, {
      id: generateUUID(),
      barrelNumber: nextNumber,
      nickname: getRandomNickname(),
      capacityLbs: selectedModel?.defaultCapacityLbs ?? undefined,
    }]);
  };

  const handleEditBarrel = (barrel: LocalBarrel) => {
    setEditingBarrel(barrel);
    setBarrelNickname(barrel.nickname || '');
    setBarrelCapacity(barrel.capacityLbs?.toString() || '');
  };

  const handleSaveBarrel = () => {
    if (!editingBarrel) return;
    setBarrels(barrels.map(b =>
      b.id === editingBarrel.id
        ? {
            ...b,
            nickname: barrelNickname || undefined,
            capacityLbs: barrelCapacity ? parseFloat(barrelCapacity) : undefined,
          }
        : b
    ));
    setEditingBarrel(null);
    setBarrelNickname('');
    setBarrelCapacity('');
  };

  const handleDeleteBarrel = (id: string) => {
    if (barrels.length <= 1) return;
    const remaining = barrels.filter(b => b.id !== id);
    // Renumber barrels
    const renumbered = remaining.map((b, i) => ({ ...b, barrelNumber: i + 1 }));
    setBarrels(renumbered);
  };

  const onSubmit = (data: FormValues) => {
    // Only include motorCapacityLbs for editable-capacity brands
    const includeCapacity = EDITABLE_CAPACITY_BRANDS.includes(data.brand);

    createMutation.mutate({
      brand: data.brand,
      model: data.model || undefined,
      tumblerType: data.tumblerType,
      motorCapacityLbs: includeCapacity ? data.motorCapacityLbs : undefined,
      notes: data.notes || undefined,
      barrels: barrels.map(b => ({
        barrelNumber: b.barrelNumber,
        nickname: b.nickname,
        capacityLbs: b.capacityLbs,
      })),
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
                    <FormDescription className="text-helpful-tip">
                      Don't see your tumbler? Choose "Generic" or "Other"
                    </FormDescription>
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
                          <SelectItem key={m.tumblerModelId} value={m.model}>{m.model}</SelectItem>
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
                name="motorCapacityLbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Motor Capacity (lbs) {isCapacityEditable ? '*' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.1}
                        max={maxCapacity}
                        step={0.1}
                        {...field}
                        value={field.value ?? ''}
                        disabled={!isCapacityEditable}
                        className={!isCapacityEditable ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormDescription className={isCapacityEditable ? 'text-helpful-tip' : ''}>
                      {isCapacityEditable
                        ? `Max total barrel weight your tumbler motor can handle (max ${maxCapacity} lbs)`
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

              {/* Barrels Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Barrels</h3>
                    <p className="text-sm text-helpful-tip">
                      Add all barrels you might run on this tumbler. For example, if your tumbler can run two 3lb barrels or one 6lb barrel, add all three here.
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={handleAddBarrel} disabled={barrels.length >= 10}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Barrel
                  </Button>
                </div>
                {barrels.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No barrels configured. Add a barrel to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {barrels.sort((a, b) => a.barrelNumber - b.barrelNumber).map((barrel) => (
                      <div
                        key={barrel.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Barrel #{barrel.barrelNumber}
                              {barrel.nickname && ` - "${barrel.nickname}"`}
                            </span>
                          </div>
                          {barrel.capacityLbs && (
                            <div className="text-sm text-muted-foreground">
                              {barrel.capacityLbs} lbs
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog
                            open={editingBarrel?.id === barrel.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingBarrel(null);
                                setBarrelNickname('');
                                setBarrelCapacity('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditBarrel(barrel)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Barrel #{barrel.barrelNumber}</DialogTitle>
                                <DialogDescription>
                                  Configure barrel settings
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Nickname</label>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="e.g., Big Blue"
                                      value={barrelNickname}
                                      onChange={(e) => setBarrelNickname(e.target.value)}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        const newNickname = getRandomNickname();
                                        if (newNickname) setBarrelNickname(newNickname);
                                      }}
                                      title="Generate random nickname"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Capacity (lbs)</label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="e.g., 3"
                                    value={barrelCapacity}
                                    onChange={(e) => setBarrelCapacity(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingBarrel(null);
                                    setBarrelNickname('');
                                    setBarrelCapacity('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button type="button" onClick={handleSaveBarrel}>
                                  Save
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {barrels.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBarrel(barrel.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
