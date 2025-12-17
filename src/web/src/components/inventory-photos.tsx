'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Image as ImageIcon, Loader2, CloudOff, Star, Camera, Pencil } from 'lucide-react';
import { photosApi } from '@/lib/api';
import { useDeleteInventoryPhoto, useSetInventoryCoverPhoto } from '@/hooks/use-inventory';
import type { InventoryPhotoDto, InventorySpecimenDto } from '@/types/inventory';
import { PhotoLightbox, useLightbox } from './photo-lightbox';
import { InventoryPhotoUploadModal } from './inventory-photo-upload-modal';
import { InventoryPhotoEditDialog } from './inventory-photo-edit-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InventoryPhotosProps {
  inventoryId: string;
  photos: InventoryPhotoDto[];
  specimens: InventorySpecimenDto[];
  onPhotosChange?: () => void;
}

export function InventoryPhotos({ inventoryId, photos, specimens, onPhotosChange }: InventoryPhotosProps) {
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<InventoryPhotoDto | null>(null);
  const lightbox = useLightbox();

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

  const handleUploadComplete = () => {
    onPhotosChange?.();
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

  const handleEdit = (photo: InventoryPhotoDto) => {
    setEditingPhoto(photo);
    setEditDialogOpen(true);
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
            onClick={() => setUploadModalOpen(true)}
          >
            <Camera className="mr-2 h-4 w-4" />
            Add Photo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors"
            onClick={() => setUploadModalOpen(true)}
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

                        {/* Badges (Cover + Specimen) */}
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {photo.isCover && (
                            <span className="px-2 py-1 bg-yellow-500 rounded text-white text-xs flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              Cover
                            </span>
                          )}
                          {photo.specimenName && (
                            <span className="px-2 py-1 bg-black/50 rounded text-white text-xs">
                              {photo.specimenName}
                            </span>
                          )}
                        </div>

                        {/* Action buttons - always visible on mobile, hover on desktop */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {photo.processingStatus === 'Completed' && (
                            <button
                              onClick={() => handleEdit(photo)}
                              className="p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                              title="Edit photo"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
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
                onClick={() => setUploadModalOpen(true)}
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

      {/* Upload Modal */}
      <InventoryPhotoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        inventoryId={inventoryId}
        specimens={specimens}
        onUploadComplete={handleUploadComplete}
      />

      {/* Edit Dialog */}
      <InventoryPhotoEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        inventoryId={inventoryId}
        photo={editingPhoto}
        specimens={specimens}
        onSuccess={onPhotosChange}
      />
    </Card>
  );
}
