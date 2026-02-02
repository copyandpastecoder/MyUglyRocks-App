'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cycleApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import type { CycleListDto } from '@/types/cycle';

const formSchema = z.object({
  sourceCycleId1: z.string().min(1, 'First cycle is required'),
  sourceCycleId2: z.string().min(1, 'Second cycle is required'),
  newCycleName: z
    .string()
    .min(1, 'Cycle name is required')
    .max(255, 'Cycle name must be at most 255 characters'),
  newCycleNotes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional(),
  startDate: z.string(),
}).refine((data) => data.sourceCycleId1 !== data.sourceCycleId2, {
  message: 'Cannot merge a cycle with itself',
  path: ['sourceCycleId2'],
});

type FormData = z.infer<typeof formSchema>;

interface MergeCyclesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cyclesToMerge: CycleListDto[];
  onSuccess?: () => void;
}

export function MergeCyclesDialog({
  open,
  onOpenChange,
  cyclesToMerge,
  onSuccess,
}: MergeCyclesDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out already-merged cycles and cycles with Completed status
  const availableCycles = useMemo(() => {
    return cyclesToMerge.filter((c) => !c.isMerged && c.status !== 'Completed');
  }, [cyclesToMerge]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceCycleId1: '',
      sourceCycleId2: '',
      newCycleName: '',
      newCycleNotes: '',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCycle1Id = form.watch('sourceCycleId1');
  const selectedCycle2Id = form.watch('sourceCycleId2');

  // Get selected cycles for preview
  const selectedCycle1 = availableCycles.find((c) => c.cycleId === selectedCycle1Id);
  const selectedCycle2 = availableCycles.find((c) => c.cycleId === selectedCycle2Id);

  // Filter second dropdown to exclude first selected cycle
  const secondCycleOptions = useMemo(() => {
    return availableCycles.filter((c) => c.cycleId !== selectedCycle1Id);
  }, [availableCycles, selectedCycle1Id]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const result = await cycleApi.mergeCycles({
        sourceCycleId1: data.sourceCycleId1,
        sourceCycleId2: data.sourceCycleId2,
        newCycleName: data.newCycleName,
        newCycleNotes: data.newCycleNotes || undefined,
        startDate: data.startDate,
      });

      toast.success(
        `Cycles merged successfully! Created ${result.newCycle.name} with ${result.specimensCopied} specimens.`
      );

      form.reset();
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }

      // Navigate to the new cycle
      router.push(`/cycles/${result.newCycle.cycleId}`);
    } catch (error) {
      console.error('Failed to merge cycles:', error);

      // Extract specific error message from API response
      let errorMessage = 'Failed to merge cycles. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data;
        errorMessage = data.error || data.message || data.title || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Cycles</DialogTitle>
          <DialogDescription>
            Combine two completed cycles into a new cycle with all specimens from both.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="sourceCycleId1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select First Cycle *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a completed cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCycles.map((cycle) => (
                        <SelectItem key={cycle.cycleId} value={cycle.cycleId}>
                          {cycle.name} - {cycle.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceCycleId2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Second Cycle *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose another completed cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {secondCycleOptions.map((cycle) => (
                        <SelectItem key={cycle.cycleId} value={cycle.cycleId}>
                          {cycle.name} - {cycle.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCycle1 && selectedCycle2 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="mt-2 space-y-2">
                  <div className="font-medium">Preview:</div>
                  <div className="text-sm">
                    <strong>{selectedCycle1.name}</strong> + <strong>{selectedCycle2.name}</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Photos from the original cycles will remain in those cycles. You can view them by
                    clicking the &quot;Merged From&quot; links on the new cycle.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="newCycleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Cycle Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Combined Winter + Fall 2026" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newCycleNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Merged from two previous cycles"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Merging...' : 'Merge Cycles'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
