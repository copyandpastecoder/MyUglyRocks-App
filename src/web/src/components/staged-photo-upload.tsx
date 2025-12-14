'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Image as ImageIcon, Loader2, CloudOff, Camera } from 'lucide-react';
import { photosApi } from '@/lib/api';

export interface StagedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface StagedPhotoUploadProps {
  photos: StagedPhoto[];
  onChange: (photos: StagedPhoto[]) => void;
  maxPhotos?: number;
}

export function StagedPhotoUpload({ photos, onChange, maxPhotos = 10 }: StagedPhotoUploadProps) {
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkStorageStatus = async () => {
      try {
        const status = await photosApi.getStorageStatus();
        setStorageConfigured(status.configured);
      } catch {
        setStorageConfigured(false);
      }
    };
    checkStorageStatus();
  }, []);

  // Clean up preview URLs when photos are removed
  useEffect(() => {
    const currentPhotos = photos;
    return () => {
      currentPhotos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const newPhotos: StagedPhoto[] = filesToAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onChange([...photos, ...newPhotos]);

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    onChange(photos.filter(p => p.id !== photoId));
  };

  if (storageConfigured === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <CloudOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
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
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
          {photos.length > 0 && photos.length < maxPhotos && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Add Photo
            </Button>
          )}
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
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              Click to add photos
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP, or HEIC up to 10MB each
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group aspect-square">
                  <img
                    src={photo.previewUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500 rounded text-white text-xs">
                      Cover
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-500/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {photos.length < maxPhotos && (
                <div
                  className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
              {photos.length > 0 && ' (first photo will be the cover)'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
