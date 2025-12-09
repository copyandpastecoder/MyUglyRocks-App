'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Image as ImageIcon, Loader2, CloudOff, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { photosApi } from '@/lib/api';
import type { PhotoDto, StageRunSummaryDto } from '@/types/cycle';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface CyclePhotosProps {
  cycleId: string;
  stages: StageRunSummaryDto[];
}

export function CyclePhotos({ cycleId, stages }: CyclePhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Find active stage for uploads (first in-progress stage)
  const activeStage = stages.find(s => s.status === 'InProgress');

  // Fetch photos for all stages
  const { data: allPhotos = [], isLoading: photosLoading, refetch: refetchPhotos } = useQuery({
    queryKey: ['cycle-photos', cycleId, stages.map(s => s.id)],
    queryFn: async () => {
      const photoPromises = stages.map(async (stage) => {
        try {
          const photos = await photosApi.getStagePhotos(stage.id);
          return photos.map(p => ({ ...p, stageName: stage.stageName }));
        } catch {
          return [];
        }
      });
      const results = await Promise.all(photoPromises);
      return results.flat();
    },
    enabled: stages.length > 0,
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeStage) {
      toast.error('Start a stage first to upload photos');
      return;
    }

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    for (const file of validFiles) {
      try {
        const result = await photosApi.uploadStagePhoto(activeStage.id, file, 'during');
        if (result.success) {
          toast.success(`Uploaded ${file.name}`);
        } else {
          toast.error(result.error || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    refetchPhotos();

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          {activeStage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Add Photo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {allPhotos.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              activeStage ? 'cursor-pointer hover:bg-muted transition-colors' : ''
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => activeStage && !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            ) : (
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            )}
            <p className="text-muted-foreground mb-2">
              {uploading ? 'Uploading...' : activeStage ? 'Drop photos here or click to upload' : 'No photos yet'}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeStage
                ? `Photos will be added to ${activeStage.stageName} stage`
                : 'Start a stage to upload photos'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allPhotos.map((photo: PhotoDto & { stageName?: string }) => (
                <div key={photo.id} className="relative group aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.fileName || 'Photo'}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    disabled={deletingPhotoId === photo.id}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {deletingPhotoId === photo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="px-2 py-1 bg-black/50 rounded text-white text-xs capitalize">
                      {photo.photoType}
                    </span>
                    {photo.stageName && (
                      <span className="px-2 py-1 bg-black/50 rounded text-white text-xs">
                        {photo.stageName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {activeStage && (
                <div
                  className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {uploading ? 'Uploading...' : 'Add more'}
                  </span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''} across {stages.length} stage{stages.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || !activeStage}
        />
      </CardContent>
    </Card>
  );
}
