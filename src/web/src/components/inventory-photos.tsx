'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Image as ImageIcon, Loader2, CloudOff, Star, Camera } from 'lucide-react';
import { photosApi } from '@/lib/api';
import { useUploadInventoryPhoto, useDeleteInventoryPhoto, useSetInventoryCoverPhoto } from '@/hooks/use-inventory';
import type { InventoryPhotoDto } from '@/types/inventory';
import { PhotoLightbox, useLightbox } from './photo-lightbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InventoryPhotosProps {
  inventoryId: string;
  photos: InventoryPhotoDto[];
  onPhotosChange?: () => void;
}

export function InventoryPhotos({ inventoryId, photos, onPhotosChange }: InventoryPhotosProps) {
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lightbox = useLightbox();

  const uploadMutation = useUploadInventoryPhoto();
  const deleteMutation = useDeleteInventoryPhoto();
  const setCoverMutation = useSetInventoryCoverPhoto();

  useEffect(() => {
    checkStorageStatus();
  }, []);

  // Auto-refetch when any photos are still processing
  useEffect(() => {
    const hasProcessingPhotos = photos.some(p => p.processingStatus === 'Processing');
    if (!hasProcessingPhotos) return;

    const interval = setInterval(() => {
      onPhotosChange?.();
    }, 2000);

    return () => clearInterval(interval);
  }, [photos, onPhotosChange]);

  const checkStorageStatus = async () => {
    try {
      const status = await photosApi.getStorageStatus();
      setStorageConfigured(status.configured);
    } catch {
      setStorageConfigured(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync({
          inventoryId,
          file,
        });
      }
      onPhotosChange?.();
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (photoId: string) => {
    setDeletingPhotoId(photoId);
    try {
      await deleteMutation.mutateAsync({ inventoryId, photoId });
      onPhotosChange?.();
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleSetCover = async (photoId: string) => {
    await setCoverMutation.mutateAsync({ inventoryId, photoId });
    onPhotosChange?.();
  };

  if (storageConfigured === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <CloudOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Photo storage is not configured
            </p>
            <p className="text-xs text-muted-foreground">
              Contact your administrator to enable photo uploads
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (storageConfigured === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {isUploading ? 'Uploading...' : 'Add Photo'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {photos.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Click to add photos
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP, or HEIC up to 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <TooltipProvider key={photo.inventoryPhotoId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group aspect-square">
                        {photo.processingStatus === 'Processing' ? (
                          <div className="w-full h-full bg-muted rounded-lg flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Processing...</span>
                          </div>
                        ) : photo.processingStatus === 'Failed' ? (
                          <div className="w-full h-full bg-destructive/10 rounded-lg flex flex-col items-center justify-center">
                            <CloudOff className="h-8 w-8 text-destructive mb-2" />
                            <span className="text-xs text-destructive">Processing failed</span>
                          </div>
                        ) : (
                          <img
                            src={photo.thumbnailUrl || photo.url}
                            alt={photo.caption || photo.fileName || 'Photo'}
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              // Find index of this photo among completed photos
                              const completedPhotos = photos.filter(p => p.processingStatus === 'Completed');
                              const index = completedPhotos.findIndex(p => p.inventoryPhotoId === photo.inventoryPhotoId);
                              if (index >= 0) lightbox.open(index);
                            }}
                          />
                        )}

                        {/* Cover badge */}
                        {photo.isCover && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 rounded text-white text-xs flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Cover
                          </div>
                        )}

                        {/* Action buttons on hover */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!photo.isCover && photo.processingStatus === 'Completed' && (
                            <button
                              onClick={() => handleSetCover(photo.inventoryPhotoId)}
                              disabled={setCoverMutation.isPending}
                              className="p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                              title="Set as cover"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(photo.inventoryPhotoId)}
                            disabled={deletingPhotoId === photo.inventoryPhotoId}
                            className="p-1 bg-black/50 rounded-full text-white hover:bg-red-500/70 transition-colors disabled:opacity-50"
                          >
                            {deletingPhotoId === photo.inventoryPhotoId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </TooltipTrigger>
                    {photo.caption && (
                      <TooltipContent>
                        <p className="max-w-xs">{photo.caption}</p>
                      </TooltipContent>
                    )}
                    {photo.processingStatus === 'Failed' && photo.processingError && (
                      <TooltipContent>
                        <p className="max-w-xs text-destructive">{photo.processingError}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}

              {/* Add more button */}
              <div
                className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Add more</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </CardContent>

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={photos
          .filter(p => p.processingStatus === 'Completed')
          .map(p => ({
            url: p.url,
            thumbnailUrl: p.thumbnailUrl,
            mediumUrl: p.mediumUrl,
            largeUrl: p.largeUrl,
            blurHash: p.blurHash,
            caption: p.caption,
          }))}
        initialIndex={lightbox.initialIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.close}
      />
    </Card>
  );
}
