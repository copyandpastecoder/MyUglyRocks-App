'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tumblerApi } from '@/lib/api';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { PageTransition } from '@/components/ui/page-transition';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, AlertTriangle, ChevronDown, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BarrelDto, UpdateBarrelRequest } from '@/types/tumbler';

const formSchema = z.object({
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().max(100).optional(),
  tumblerType: z.enum(['Rotary', 'Vibratory']),
  motorCapacityLbs: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return typeof val === 'number' ? val : parseFloat(val);
  }),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean(),
});

type FormValues = {
  brand: string;
  model?: string;
  tumblerType: 'Rotary' | 'Vibratory';
  motorCapacityLbs?: number;
  notes?: string;
  isActive: boolean;
};

const barrelFormSchema = z.object({
  nickname: z.string().max(50).optional(),
  capacityLbs: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  defaultGritAmountGrams: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  isDedicated: z.boolean(),
  isActive: z.boolean(),
});

type BarrelFormValues = {
  nickname?: string;
  capacityLbs?: number;
  defaultGritAmountGrams?: number;
  isDedicated: boolean;
  isActive: boolean;
};

export default function EditTumblerPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const tumblerId = params.id as string;

  const [editingBarrel, setEditingBarrel] = useState<BarrelDto | null>(null);
  const [, setIsAddingBarrel] = useState(false);

  const { data: tumbler, isLoading } = useQuery({
    queryKey: ['tumbler', tumblerId],
    queryFn: () => tumblerApi.getById(tumblerId),
    enabled: !!tumblerId,
  });

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type inference limitation
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      brand: '',
      model: '',
      tumblerType: 'Rotary',
      motorCapacityLbs: undefined,
      notes: '',
      isActive: true,
    },
    values: tumbler ? {
      brand: tumbler.brand,
      model: tumbler.model || '',
      tumblerType: tumbler.tumblerType as 'Rotary' | 'Vibratory',
      motorCapacityLbs: tumbler.motorCapacityLbs ?? undefined,
      notes: tumbler.notes || '',
      isActive: tumbler.isActive,
    } : undefined,
  });

  const barrelForm = useForm<BarrelFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type inference limitation
    resolver: zodResolver(barrelFormSchema) as any,
    defaultValues: {
      nickname: '',
      capacityLbs: undefined,
      isDedicated: false,
      isActive: true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => tumblerApi.update(tumblerId, {
      brand: data.brand,
      model: data.model || undefined,
      tumblerType: data.tumblerType,
      motorCapacityLbs: data.motorCapacityLbs,
      notes: data.notes || undefined,
      isActive: data.isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumbler', tumblerId] });
      queryClient.invalidateQueries({ queryKey: ['tumblers'] });
      toast.success('Tumbler updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tumbler');
    },
  });

  const addBarrelMutation = useMutation({
    mutationFn: () => {
      const nextBarrelNumber = tumbler ? Math.max(...tumbler.barrels.map(b => b.barrelNumber), 0) + 1 : 1;
      return tumblerApi.addBarrel(tumblerId, { barrelNumber: nextBarrelNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumbler', tumblerId] });
      queryClient.invalidateQueries({ queryKey: ['tumblers'] });
      toast.success('Barrel added successfully');
      setIsAddingBarrel(false);
    },
    onError: () => {
      toast.error('Failed to add barrel');
    },
  });

  const updateBarrelMutation = useMutation({
    mutationFn: ({ barrelId, data }: { barrelId: string; data: UpdateBarrelRequest }) =>
      tumblerApi.updateBarrel(barrelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumbler', tumblerId] });
      toast.success('Barrel updated successfully');
      setEditingBarrel(null);
    },
    onError: () => {
      toast.error('Failed to update barrel');
    },
  });

  const deleteBarrelMutation = useMutation({
    mutationFn: tumblerApi.deleteBarrel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tumbler', tumblerId] });
      queryClient.invalidateQueries({ queryKey: ['tumblers'] });
      toast.success('Barrel removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove barrel');
    },
  });

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  const onBarrelSubmit = (data: BarrelFormValues) => {
    if (editingBarrel) {
      updateBarrelMutation.mutate({
        barrelId: editingBarrel.barrelId,
        data: {
          nickname: data.nickname || undefined,
          capacityLbs: data.capacityLbs,
          defaultGritAmountGrams: data.defaultGritAmountGrams,
          isDedicated: data.isDedicated,
          isActive: data.isActive,
        },
      });
    }
  };

  const handleEditBarrel = (barrel: BarrelDto) => {
    setEditingBarrel(barrel);
    barrelForm.reset({
      nickname: barrel.nickname || '',
      capacityLbs: barrel.capacityLbs ?? undefined,
      defaultGritAmountGrams: barrel.defaultGritAmountGrams ?? undefined,
      isDedicated: barrel.isDedicated,
      isActive: barrel.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tumbler) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Tumbler not found</h2>
          <p className="text-muted-foreground mt-2">This tumbler may have been deleted.</p>
          <Button asChild className="mt-4">
            <Link href="/tumblers">Back to Tumblers</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate capacity warning
  const totalActiveCapacity = tumbler.barrels
    .filter(b => b.isActive)
    .reduce((sum, b) => sum + (b.capacityLbs || 0), 0);
  const motorCapacity = tumbler.motorCapacityLbs || 0;
  const hasCapacityWarning = motorCapacity > 0 && totalActiveCapacity > motorCapacity;

  return (
    <PageTransition>
      <div className={PAGE_CONTAINER}>
        {/* Compact Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/tumblers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight truncate">
                {tumbler.brand} {tumbler.model}
              </h1>
              {!tumbler.isActive && <Badge variant="secondary">Inactive</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {tumbler.tumblerType} · {tumbler.barrels.length} barrel{tumbler.barrels.length !== 1 ? 's' : ''}
              {motorCapacity > 0 && ` · ${motorCapacity} lbs capacity`}
            </p>
          </div>
        </div>

        {/* Capacity Warning - Compact */}
        {hasCapacityWarning && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Total barrel capacity ({totalActiveCapacity.toFixed(1)} lbs) exceeds motor ({motorCapacity.toFixed(1)} lbs)
            </AlertDescription>
          </Alert>
        )}

        {/* Barrels Section - Primary Focus */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Barrels</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addBarrelMutation.mutate()}
              disabled={addBarrelMutation.isPending}
              className="h-8"
            >
              {addBarrelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">Add</span>
            </Button>
          </div>

          {tumbler.barrels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              No barrels configured
            </div>
          ) : (
            <div className="grid gap-2">
              {tumbler.barrels.sort((a, b) => a.barrelNumber - b.barrelNumber).map((barrel) => (
                <div
                  key={barrel.barrelId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Barrel Number Circle */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {barrel.barrelNumber}
                  </div>

                  {/* Barrel Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {barrel.nickname || `Barrel #${barrel.barrelNumber}`}
                      </span>
                      {barrel.isMounted && (
                        <Badge variant="default" className="bg-blue-500 text-xs">In Use</Badge>
                      )}
                      {!barrel.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                      {barrel.isDedicated && (
                        <Badge variant="outline" className="text-xs">Dedicated</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {barrel.capacityLbs ? `${barrel.capacityLbs} lbs` : 'No capacity set'}
                      {barrel.defaultGritAmountGrams && ` · ${barrel.defaultGritAmountGrams}g grit`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Dialog open={editingBarrel?.barrelId === barrel.barrelId} onOpenChange={(open) => !open && setEditingBarrel(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditBarrel(barrel)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Edit Barrel #{barrel.barrelNumber}</DialogTitle>
                          <DialogDescription>Update barrel settings</DialogDescription>
                        </DialogHeader>
                        <Form {...barrelForm}>
                          <form onSubmit={barrelForm.handleSubmit(onBarrelSubmit)} className="space-y-4">
                            <FormField
                              control={barrelForm.control}
                              name="nickname"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nickname</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Big Blue" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={barrelForm.control}
                                name="capacityLbs"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Capacity (lbs)</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.1" min="0" placeholder="3" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={barrelForm.control}
                                name="defaultGritAmountGrams"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Grit (grams)</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="1" placeholder="45" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex items-center justify-between py-2 border-t">
                              <div className="flex items-center gap-4">
                                <FormField
                                  control={barrelForm.control}
                                  name="isDedicated"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                      <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">Dedicated</FormLabel>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={barrelForm.control}
                                  name="isActive"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                      <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">Active</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditingBarrel(null)}>
                                Cancel
                              </Button>
                              <Button type="submit" size="sm" disabled={updateBarrelMutation.isPending}>
                                {updateBarrelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    {tumbler.barrels.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => deleteBarrelMutation.mutate(barrel.barrelId)}
                        disabled={deleteBarrelMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tumbler Settings - Collapsible */}
        <Collapsible defaultOpen={true}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <span className="uppercase tracking-wide flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Tumbler Settings
              </span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border rounded-lg p-4 mt-2 space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Lortone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., QT-66" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tumblerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Rotary">Rotary</SelectItem>
                              <SelectItem value="Vibratory">Vibratory</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motorCapacityLbs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motor Capacity (lbs)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="e.g., 6"
                              disabled={!tumbler?.isMotorCapacityEditable}
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-sm">Active</FormLabel>
                          <FormDescription className="text-xs">Show in cycle selection</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
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
                          <Textarea placeholder="Any notes..." className="min-h-[60px] resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </PageTransition>
  );
}
