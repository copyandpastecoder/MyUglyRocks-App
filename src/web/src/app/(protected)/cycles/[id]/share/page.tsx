'use client';

import { useState, useEffect } from 'react';
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
  Check,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LazyImage } from '@/components/lazy-image';
import type { CyclePhotoDto } from '@/types/cycle';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareCyclePage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);

  const { data: cycle, isLoading } = useQuery({
    queryKey: ['cycle', cycleId],
    queryFn: () => cycleApi.getById(cycleId),
  });

  const { data: photos, isLoading: photosLoading } = useQuery({
    queryKey: ['cycle-photos', cycleId],
    queryFn: () => cycleApi.getPhotos(cycleId),
    enabled: !!cycle && cycle.status === 'Completed',
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Set default title once cycle loads
  useEffect(() => {
    if (cycle) {
      form.setValue('title', cycle.name);
    }
  }, [cycle, form]);

  // Auto-select all photos and set first as cover when photos load
  useEffect(() => {
    if (photos && photos.length > 0 && selectedPhotoIds.length === 0) {
      setSelectedPhotoIds(photos.map(p => p.id));
      setCoverPhotoId(photos[0].id);
    }
  }, [photos, selectedPhotoIds.length]);

  const createPostMutation = useMutation({
    mutationFn: (data: FormValues) =>
      postApi.create({
        cycleId,
        title: data.title,
        description: data.description || undefined,
        photoIds: selectedPhotoIds,
        coverPhotoId: coverPhotoId || undefined,
      }),
    onSuccess: (post) => {
      toast.success('Post created! Your rocks are now in the gallery.');
      router.push(`/gallery/${post.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create post');
    },
  });

  const onSubmit = (data: FormValues) => {
    createPostMutation.mutate(data);
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      if (prev.includes(photoId)) {
        // If removing and it's the cover, unset cover
        if (coverPhotoId === photoId) {
          const remaining = prev.filter(id => id !== photoId);
          setCoverPhotoId(remaining.length > 0 ? remaining[0] : null);
        }
        return prev.filter(id => id !== photoId);
      } else {
        // If this is the first selection, make it the cover
        if (prev.length === 0) {
          setCoverPhotoId(photoId);
        }
        return [...prev, photoId];
      }
    });
  };

  const setCoverPhoto = (photoId: string) => {
    // Ensure photo is selected
    if (!selectedPhotoIds.includes(photoId)) {
      setSelectedPhotoIds(prev => [...prev, photoId]);
    }
    setCoverPhotoId(photoId);
  };

  const selectAllPhotos = () => {
    if (photos) {
      setSelectedPhotoIds(photos.map(p => p.id));
      if (!coverPhotoId && photos.length > 0) {
        setCoverPhotoId(photos[0].id);
      }
    }
  };

  const deselectAllPhotos = () => {
    setSelectedPhotoIds([]);
    setCoverPhotoId(null);
  };

  // Group photos by stage
  const groupedPhotos = photos?.reduce((acc, photo) => {
    const key = `${photo.stageName} (Run ${photo.runNumber})`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(photo);
    return acc;
  }, {} as Record<string, CyclePhotoDto[]>) || {};

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
              {cycle.specimens && cycle.specimens.length > 0
                ? (() => {
                    const difficulties = cycle.specimens
                      .map(s => s.tumblingDifficulty)
                      .filter(Boolean);
                    if (difficulties.length === 0) return 'Not rated';
                    if (difficulties.includes('Hard')) return 'Hard';
                    if (difficulties.includes('Medium')) return 'Medium';
                    return 'Easy';
                  })()
                : cycle.difficultyRating
                  ? `${cycle.difficultyRating}/5`
                  : 'Not rated'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Specimens</p>
            <p className="font-medium">
              {cycle.specimens && cycle.specimens.length > 0
                ? cycle.specimens.map(s => s.commonName).join(', ')
                : cycle.additionalSpecimens || 'Not specified'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Photo Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Select Photos</CardTitle>
              <CardDescription>
                Choose which photos to include in your post. Click the star to set the cover photo.
              </CardDescription>
            </div>
            {photos && photos.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllPhotos}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllPhotos}>
                  Deselect All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {photosLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : !photos || photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Photos Available</h3>
              <p className="text-muted-foreground max-w-md">
                This cycle doesn't have any photos yet. You can still share your cycle,
                but consider adding photos to your stage runs first for a more engaging post.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPhotos).map(([stageName, stagePhotos]) => (
                <div key={stageName}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">{stageName}</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {stagePhotos.map((photo) => {
                      const isSelected = selectedPhotoIds.includes(photo.id);
                      const isCover = coverPhotoId === photo.id;

                      return (
                        <div key={photo.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => togglePhotoSelection(photo.id)}
                            className={cn(
                              'relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all',
                              isSelected
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-transparent hover:border-muted-foreground/30'
                            )}
                          >
                            <LazyImage
                              src={photo.thumbnailUrl || photo.url}
                              alt={photo.caption || `Photo from ${stageName}`}
                              blurHash={photo.blurHash}
                              className="w-full h-full object-cover"
                              wrapperClassName="w-full h-full"
                            />
                            {/* Selection indicator */}
                            <div
                              className={cn(
                                'absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'bg-background/80 border-muted-foreground/50'
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </button>

                          {/* Cover photo button */}
                          {isSelected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCoverPhoto(photo.id);
                              }}
                              className={cn(
                                'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                                isCover
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-background/80 text-muted-foreground hover:bg-yellow-500/20 hover:text-yellow-600'
                              )}
                              title={isCover ? 'Cover photo' : 'Set as cover photo'}
                            >
                              <Star className={cn('h-3.5 w-3.5', isCover && 'fill-current')} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <span>{selectedPhotoIds.length} photo{selectedPhotoIds.length !== 1 ? 's' : ''} selected</span>
                {coverPhotoId && (
                  <>
                    <span>-</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      Cover photo set
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
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
