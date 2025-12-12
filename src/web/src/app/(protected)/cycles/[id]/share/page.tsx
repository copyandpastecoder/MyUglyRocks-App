'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cycleApi, postApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Share2,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareCyclePage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

  const { data: cycle, isLoading } = useQuery({
    queryKey: ['cycle', cycleId],
    queryFn: () => cycleApi.getById(cycleId),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Set default title once cycle loads
  useState(() => {
    if (cycle) {
      form.setValue('title', cycle.name);
    }
  });

  const createPostMutation = useMutation({
    mutationFn: (data: FormValues) =>
      postApi.create({
        cycleId,
        title: data.title,
        description: data.description || undefined,
        photoIds: [], // Photos will be added when R2 is set up
      }),
    onSuccess: (post) => {
      toast.success('Post created! Your rocks are now in the gallery.');
      router.push(`/gallery/${post.postId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create post');
    },
  });

  const onSubmit = (data: FormValues) => {
    createPostMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Cycle not found</h2>
        <Button asChild className="mt-4">
          <Link href="/cycles">Back to Cycles</Link>
        </Button>
      </div>
    );
  }

  if (cycle.status !== 'Completed') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/cycles/${cycleId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Share Your Results</h1>
            <p className="text-muted-foreground">Share your tumbled rocks with the community</p>
          </div>
        </div>

        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="font-medium">Cycle not completed</p>
              <p className="text-sm text-muted-foreground">
                You can only share completed cycles. Please complete this cycle first.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button asChild>
          <Link href={`/cycles/${cycleId}`}>Back to Cycle</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/cycles/${cycleId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Share Your Results</h1>
          <p className="text-muted-foreground">Share your tumbled rocks with the community</p>
        </div>
      </div>

      {/* Cycle Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{cycle.name}</CardTitle>
            <Badge variant="secondary">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          </div>
          <CardDescription>
            {cycle.stageRuns.length} stages - {cycle.goal || 'No goal specified'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Started</p>
            <p className="font-medium">{new Date(cycle.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Difficulty</p>
            <p className="font-medium">
              {cycle.difficultyRating ? `${cycle.difficultyRating}/5` : 'Not rated'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Specimens</p>
            <p className="font-medium">{cycle.additionalSpecimens || 'Not specified'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Photo Selection Placeholder */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Photo Selection Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Once photo uploads are enabled, you'll be able to select which photos
            to include in your post. For now, posts will be created without photos.
          </p>
        </CardContent>
      </Card>

      {/* Post Form */}
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>
            Give your post a catchy title and describe your tumbling experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., My First Batch of Agates"
                        {...field}
                        defaultValue={cycle.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell the story of this tumbling cycle. What rocks did you use? Any challenges? Tips for others?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share details about your process, the specimens, and any lessons learned
                    </FormDescription>
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
                <Button type="submit" disabled={createPostMutation.isPending}>
                  {createPostMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="mr-2 h-4 w-4" />
                  )}
                  Share to Gallery
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
