'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInventoryItem } from '@/hooks/use-inventory';
import { useTimezone } from '@/hooks/use-user';
import { postApi } from '@/lib/api';
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
  Check,
  Star,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LazyImage } from '@/components/lazy-image';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const { formatDate } = useTimezone();
  const inventoryId = params.id as string;

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const hasInitializedPhotos = useRef(false);

  const { data: inventory, isLoading } = useInventoryItem(inventoryId);

  // Filter to only show completed photos (not processing or failed)
  const completedPhotos = inventory?.photos?.filter(p => p.processingStatus === 'Completed') ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Set default title once inventory loads
  useEffect(() => {
    if (inventory) {
      form.setValue('title', inventory.name);
    }
  }, [inventory, form]);

  // Auto-select all completed photos and set first as cover when photos load (once only)
  /* eslint-disable react-hooks/set-state-in-effect -- One-time initialization from async data */
  useEffect(() => {
    if (!hasInitializedPhotos.current && completedPhotos.length > 0) {
      hasInitializedPhotos.current = true;
      setSelectedPhotoIds(completedPhotos.map(p => p.inventoryPhotoId));
      setCoverPhotoId(completedPhotos[0].inventoryPhotoId);
    }
  }, [completedPhotos]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const createPostMutation = useMutation({
    mutationFn: (data: FormValues) =>
      postApi.create({
        inventoryId,
        title: data.title,
        description: data.description || undefined,
        photoIds: selectedPhotoIds,
        coverPhotoId: coverPhotoId || undefined,
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
    if (completedPhotos.length > 0) {
      setSelectedPhotoIds(completedPhotos.map(p => p.inventoryPhotoId));
      if (!coverPhotoId) {
        setCoverPhotoId(completedPhotos[0].inventoryPhotoId);
      }
    }
  };

  const deselectAllPhotos = () => {
    setSelectedPhotoIds([]);
    setCoverPhotoId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Inventory not found</h2>
        <Button asChild className="mt-4">
          <Link href="/inventory">Back to Inventory</Link>
        </Button>
      </div>
    );
  }

  if (completedPhotos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/inventory/${inventoryId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Share to Gallery</h1>
            <p className="text-muted-foreground">Share your rocks with the community</p>
          </div>
        </div>

        <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950">
          <CardContent className="flex items-center gap-4 py-6">
            <ImageIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium">No photos available</p>
              <p className="text-sm text-muted-foreground">
                Add some photos to your inventory before sharing to the gallery.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button asChild>
          <Link href={`/inventory/${inventoryId}`}>Back to Inventory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/inventory/${inventoryId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Share to Gallery</h1>
          <p className="text-muted-foreground">Share your rocks with the community</p>
        </div>
      </div>

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{inventory.name}</CardTitle>
            </div>
            <Badge variant="secondary">{inventory.sourceType}</Badge>
          </div>
          <CardDescription>
            Acquired {formatDate(inventory.acquiredDate, 'MMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Source</p>
            <p className="font-medium">{inventory.sourceName || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Specimens</p>
            <p className="font-medium">
              {inventory.specimens.length > 0
                ? inventory.specimens.map(s => s.commonName).join(', ')
                : 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Photos</p>
            <p className="font-medium">{completedPhotos.length} available</p>
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
            {completedPhotos.length > 0 && (
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
          <div className="space-y-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {completedPhotos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.inventoryPhotoId);
                const isCover = coverPhotoId === photo.inventoryPhotoId;

                return (
                  <div key={photo.inventoryPhotoId} className="relative group">
                    <button
                      type="button"
                      onClick={() => togglePhotoSelection(photo.inventoryPhotoId)}
                      className={cn(
                        'relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-muted-foreground/30'
                      )}
                    >
                      <LazyImage
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.caption || 'Inventory photo'}
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
                          setCoverPhoto(photo.inventoryPhotoId);
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
        </CardContent>
      </Card>

      {/* Post Form */}
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>
            Give your post a catchy title and describe your rocks
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
                        placeholder="e.g., Beautiful Agates from Oregon"
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
                        placeholder="Tell us about these rocks. Where did you find them? What makes them special?"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share details about the source, specimens, or anything interesting about your collection
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
                <Button
                  type="submit"
                  disabled={createPostMutation.isPending || selectedPhotoIds.length === 0}
                >
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
