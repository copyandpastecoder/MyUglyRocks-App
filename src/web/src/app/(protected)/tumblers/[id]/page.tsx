'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tumblerApi } from '@/lib/api';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const tumblerId = params.id as string;

  const [editingBarrel, setEditingBarrel] = useState<BarrelDto | null>(null);
  const [isAddingBarrel, setIsAddingBarrel] = useState(false);

  const { data: tumbler, isLoading } = useQuery({
    queryKey: ['tumbler', tumblerId],
    queryFn: () => tumblerApi.getById(tumblerId),
    enabled: !!tumblerId,
  });

  const form = useForm<FormValues>({
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

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tumblers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Tumbler</h1>
          <p className="text-muted-foreground">Update your tumbler details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tumbler Details</CardTitle>
          <CardDescription>
            Update the details of your rock tumbler
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
                    <FormControl>
                      <Input placeholder="e.g., Lortone, National Geographic" {...field} />
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
                      <Input placeholder="e.g., QT-66, 3A, 45C" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional model name or number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tumblerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      key={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tumbler type" />
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
                    <FormDescription>
                      {tumbler?.isMotorCapacityEditable
                        ? 'Maximum weight the motor can handle'
                        : 'Motor capacity is fixed for this tumbler model'
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Inactive tumblers won't appear in cycle selection
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
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Barrels</CardTitle>
            <CardDescription>
              Manage the barrels for this tumbler
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => addBarrelMutation.mutate()}
            disabled={addBarrelMutation.isPending}
          >
            {addBarrelMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Barrel
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Capacity Warning Banner */}
          {(() => {
            const totalActiveCapacity = tumbler.barrels
              .filter(b => b.isActive)
              .reduce((sum, b) => sum + (b.capacityLbs || 0), 0);
            const motorCapacity = tumbler.motorCapacityLbs || 0;

            if (motorCapacity > 0 && totalActiveCapacity > motorCapacity) {
              return (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Capacity Warning</AlertTitle>
                  <AlertDescription>
                    Total active barrel capacity ({totalActiveCapacity.toFixed(1)} lbs) exceeds
                    motor capacity ({motorCapacity.toFixed(1)} lbs). Running all barrels simultaneously
                    may damage the motor.
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()}

          {tumbler.barrels.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No barrels configured. Add a barrel to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {tumbler.barrels.sort((a, b) => a.barrelNumber - b.barrelNumber).map((barrel) => (
                <div
                  key={barrel.barrelId}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Barrel #{barrel.barrelNumber}
                        {barrel.nickname && ` - "${barrel.nickname}"`}
                      </span>
                      {!barrel.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {barrel.isDedicated && (
                        <Badge variant="outline">Dedicated</Badge>
                      )}
                      {barrel.isMounted && (
                        <Badge variant="default" className="bg-blue-500">In Use</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {barrel.capacityLbs && (
                        <span>
                          {barrel.capacityLbs} lbs
                        </span>
                      )}
                      {barrel.defaultGritAmountGrams && (
                        <span className="ml-3">
                          Default grit: {barrel.defaultGritAmountGrams}g
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={editingBarrel?.barrelId === barrel.barrelId} onOpenChange={(open) => !open && setEditingBarrel(null)}>
                      <DialogTrigger asChild>
                        <Button
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
                            Update barrel settings
                          </DialogDescription>
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={barrelForm.control}
                              name="capacityLbs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Capacity (lbs)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      placeholder="e.g., 3"
                                      {...field}
                                      value={field.value ?? ''}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Barrel capacity in pounds
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={barrelForm.control}
                              name="defaultGritAmountGrams"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default Grit Amount (grams)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="1"
                                      placeholder="e.g., 45"
                                      {...field}
                                      value={field.value ?? ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={barrelForm.control}
                              name="isDedicated"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Dedicated Barrel</FormLabel>
                                    <FormDescription>
                                      Only used for specific stages
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
                              control={barrelForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Active</FormLabel>
                                    <FormDescription>
                                      Inactive barrels won't appear in selections
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

                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingBarrel(null)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateBarrelMutation.isPending}>
                                {updateBarrelMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
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
                        onClick={() => deleteBarrelMutation.mutate(barrel.barrelId)}
                        disabled={deleteBarrelMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
