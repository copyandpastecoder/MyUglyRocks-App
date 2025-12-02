'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cycleApi, tumblerApi } from '@/lib/api';
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

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  startDate: z.string().min(1, 'Start date is required'),
  goal: z.string().max(255).optional(),
  difficultyRating: z.string().optional(),
  additionalSpecimens: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCyclePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: tumblers } = useQuery({
    queryKey: ['tumblers'],
    queryFn: tumblerApi.getAll,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      goal: '',
      difficultyRating: '',
      additionalSpecimens: '',
      notes: '',
    },
  });

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
    createMutation.mutate({
      name: data.name,
      startDate: data.startDate,
      goal: data.goal || undefined,
      difficultyRating: data.difficultyRating ? parseInt(data.difficultyRating) : undefined,
      additionalSpecimens: data.additionalSpecimens || undefined,
      notes: data.notes || undefined,
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
          <CardDescription>
            Give your cycle a name and set your goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Beach Agates Batch 1" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name to identify this batch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., High polish, smooth finish" {...field} />
                    </FormControl>
                    <FormDescription>
                      What are you trying to achieve with this cycle?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficultyRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Easy</SelectItem>
                        <SelectItem value="2">2 - Easy</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Hard</SelectItem>
                        <SelectItem value="5">5 - Very Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Based on rock hardness and desired outcome
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalSpecimens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rocks/Specimens</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Agates, jasper, petrified wood..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      What rocks are you tumbling in this batch?
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
