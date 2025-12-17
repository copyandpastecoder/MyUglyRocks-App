'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Image as ImageIcon, Loader2, CloudOff, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cycleApi, photosApi } from '@/lib/api';
import { formatStageDisplayName } from '@/lib/cycle-utils';
import type { CyclePhotoDto, StageRunSummaryDto } from '@/types/cycle';
import { useQuery } from '@tanstack/react-query';
import { PhotoUploadModal } from './photo-upload-modal';
import { PhotoLightbox, useLightbox } from './photo-lightbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CyclePhotosProps {
  cycleId: string;
  stages: StageRunSummaryDto[];
}

export function CyclePhotos({ cycleId, stages }: CyclePhotosProps) {
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const lightbox = useLightbox();

  // Fetch all photos for the cycle in a single request
  const { data: allPhotos = [], isLoading: photosLoading, refetch: refetchPhotos } = useQuery({
    queryKey: ['cycle-photos', cycleId],
    queryFn: async () => {
      const photos = await cycleApi.getPhotos(cycleId);
      // Find totalRuns for each stage to format display name
      const stageTotalsMap = stages.reduce((acc, s) => {
        acc[s.stageRunId] = s.totalRuns;
        return acc;
      }, {} as Record<string, number>);

      return photos.map(p => ({
        ...p,
        stageDisplayName: formatStageDisplayName(p.stageName, p.runNumber, stageTotalsMap[p.stageRunId] ?? 1)
      }));
    },
    enabled: stages.length > 0,
    // Auto-refetch every 2 seconds if any photos are still processing
    refetchInterval: (query) => {
      const photos = query.state.data ?? [];
      return photos.some(p => p.processingStatus === 'Processing') ? 2000 : false;
    },
  });

  useEffect(() => {
    checkStorageStatus();
  }, []);

  const checkStorageStatus = async () => {
    try {
      const status = await photosApi.getStorageStatus();
      setStorageConfigured(status.configured);
    } catch {
      setStorageConfigured(false);
    }
  };

  const removePhoto = async (photoId: string) => {
    setDeletingPhotoId(photoId);
    try {
      await photosApi.deletePhoto(photoId);
      toast.success('Photo deleted');
      refetchPhotos();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete photo');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleUploadComplete = () => {
    refetchPhotos();
  };

  const canUpload = stages.length > 0;

  if (storageConfigured === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Cycle Photos
          </CardTitle>
          <CardDescription>Track your progress with before, during, and after photos</CardDescription>
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

  if (storageConfigured === null || photosLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Cycle Photos
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Cycle Photos
              </CardTitle>
              <CardDescription>Track your progress with before, during, and after photos</CardDescription>
            </div>
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
              >
                <Camera className="mr-2 h-4 w-4" />
                New Photo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allPhotos.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                canUpload ? 'cursor-pointer hover:bg-muted transition-colors' : ''
              }`}
              onClick={() => canUpload && setUploadModalOpen(true)}
            >
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {canUpload ? 'Click to add your first photo' : 'No photos yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {canUpload
                  ? 'Select a stage and photo type when uploading'
                  : 'Add a stage to start uploading photos'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allPhotos.map((photo: CyclePhotoDto & { stageDisplayName?: string }) => (
                  <TooltipProvider key={photo.photoId}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative group aspect-square">
                          {photo.processingStatus === 'Processing' ? (
                            // Show loading placeholder while processing
                            <div className="w-full h-full bg-muted rounded-lg flex flex-col items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground">Processing...</span>
                            </div>
                          ) : photo.processingStatus === 'Failed' ? (
                            // Show error state for failed processing
                            <div className="w-full h-full bg-destructive/10 rounded-lg flex flex-col items-center justify-center">
                              <CloudOff className="h-8 w-8 text-destructive mb-2" />
                              <span className="text-xs text-destructive">Processing failed</span>
                            </div>
                          ) : (
                            // Show actual image when completed
                            <img
                              src={photo.thumbnailUrl || photo.url}
                              alt={photo.caption || photo.fileName || 'Photo'}
                              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                // Find index of this photo among completed photos
                                const completedPhotos = allPhotos.filter(p => p.processingStatus === 'Completed');
                                const index = completedPhotos.findIndex(p => p.photoId === photo.photoId);
                                if (index >= 0) lightbox.open(index);
                              }}
                            />
                          )}
                          <button
                            onClick={() => removePhoto(photo.photoId)}
                            disabled={deletingPhotoId === photo.photoId}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          >
                            {deletingPhotoId === photo.photoId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                          <div className="absolute bottom-2 left-2 flex gap-1">
                            <span className="px-2 py-1 bg-black/50 rounded text-white text-xs capitalize">
                              {photo.photoType}
                            </span>
                            {photo.stageDisplayName && (
                              <span className="px-2 py-1 bg-black/50 rounded text-white text-xs">
                                {photo.stageDisplayName}
                              </span>
                            )}
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
                {canUpload && (
                  <div
                    className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add more</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''} across {stages.length} stage{stages.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        stages={stages}
        onUploadComplete={handleUploadComplete}
      />

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={allPhotos
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
    </>
  );
}
