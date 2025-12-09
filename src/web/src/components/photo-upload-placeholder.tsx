'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImagePlus, Upload, X, Image as ImageIcon, Loader2, CloudOff } from 'lucide-react';
import { toast } from 'sonner';
import { photosApi } from '@/lib/api';
import type { PhotoDto } from '@/types/cycle';

interface PhotoUploadProps {
  stageRunId: string;
  title?: string;
  description?: string;
  maxPhotos?: number;
  photoType?: 'before' | 'during' | 'after';
  initialPhotos?: PhotoDto[];
  onPhotosChange?: (photos: PhotoDto[]) => void;
}

export function PhotoUpload({
  stageRunId,
  title = 'Photos',
  description = 'Upload before and after photos to track your progress',
  maxPhotos = 10,
  photoType = 'during',
  initialPhotos = [],
  onPhotosChange,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoDto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkStorageStatus();
  }, []);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const checkStorageStatus = async () => {
    try {
      const status = await photosApi.getStorageStatus();
      setStorageConfigured(status.configured);
    } catch {
      setStorageConfigured(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

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
    const uploadedPhotos: PhotoDto[] = [];

    for (const file of validFiles) {
      try {
        const result = await photosApi.uploadStagePhoto(stageRunId, file, photoType);
        if (result.success && result.photo) {
          uploadedPhotos.push(result.photo);
          toast.success(`Uploaded ${file.name}`);
        } else {
          toast.error(result.error || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedPhotos.length > 0) {
      const newPhotos = [...photos, ...uploadedPhotos];
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = async (photoId: string) => {
    try {
      await photosApi.deletePhoto(photoId);
      const newPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
      toast.success('Photo deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete photo');
    }
  };

  if (storageConfigured === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            ) : (
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            )}
            <p className="text-muted-foreground mb-2">
              {uploading ? 'Uploading...' : 'Drop photos here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, HEIC up to 10MB each (max {maxPhotos} photos)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative group aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.fileName || 'Photo'}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs capitalize">
                    {photo.photoType}
                  </div>
                </div>
              ))}
              {photos.length < maxPhotos && (
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{photos.length} of {maxPhotos} photos</span>
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
          disabled={uploading}
        />
      </CardContent>
    </Card>
  );
}

// Legacy component for backwards compatibility (local-only preview)
interface PhotoUploadPlaceholderProps {
  title?: string;
  description?: string;
  maxPhotos?: number;
}

interface PreviewPhoto {
  id: string;
  file: File;
  preview: string;
}

export function PhotoUploadPlaceholder({
  title = 'Photos',
  description = 'Upload before and after photos to track your progress',
  maxPhotos = 10,
}: PhotoUploadPlaceholderProps) {
  const [photos, setPhotos] = useState<PreviewPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

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

    const newPhotos = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos(prev => [...prev, ...newPhotos]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (newPhotos.length > 0) {
      toast.info('Photos added locally (cloud upload coming soon)', {
        description: 'Photos will be saved when cloud storage is configured',
      });
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Drop photos here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG up to 10MB each (max {maxPhotos} photos)
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-full">
              <Upload className="h-3 w-3" />
              Cloud upload coming soon
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative group aspect-square">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                    Local preview
                  </div>
                </div>
              ))}
              {photos.length < maxPhotos && (
                <div
                  className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Add more</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{photos.length} of {maxPhotos} photos</span>
              <span className="flex items-center gap-1 text-yellow-600">
                <Upload className="h-3 w-3" />
                Uploads will be saved when cloud storage is configured
              </span>
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
        />
      </CardContent>
    </Card>
  );
}
