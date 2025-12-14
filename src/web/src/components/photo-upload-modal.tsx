'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { photosApi } from '@/lib/api';
import type { StageRunSummaryDto } from '@/types/cycle';
import { cn } from '@/lib/utils';

interface PhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: StageRunSummaryDto[];
  onUploadComplete: () => void;
  defaultStageId?: string;
}

type PhotoType = 'before' | 'during' | 'after';

// Safe image MIME types - excludes SVG which can contain scripts
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

export function PhotoUploadModal({
  open,
  onOpenChange,
  stages,
  onUploadComplete,
  defaultStageId,
}: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string>(defaultStageId || '');
  const [photoType, setPhotoType] = useState<PhotoType>('during');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ stage?: string; photoType?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedStageId with defaultStageId when modal opens
  useEffect(() => {
    if (open && defaultStageId) {
      setSelectedStageId(defaultStageId);
    }
  }, [open, defaultStageId]);

  const formatStageDisplayName = (stage: StageRunSummaryDto): string => {
    const statusLabel = stage.status === 'Active' ? ' (Active)' :
                       stage.status === 'Completed' ? ' (Completed)' : '';
    if (stage.totalRuns <= 1) {
      return `${stage.stageName}${statusLabel}`;
    }
    return `${stage.stageName} Run ${stage.runNumber}${statusLabel}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate against allowlist of safe image types (excludes SVG to prevent XSS)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP, HEIC, HEIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    clearFile();
    setSelectedStageId('');
    setPhotoType('during');
    setCaption('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validate = (): boolean => {
    const newErrors: { stage?: string; photoType?: string } = {};

    if (!selectedStageId) {
      newErrors.stage = 'Please select a stage';
    }

    if (!photoType) {
      newErrors.photoType = 'Please select a photo type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo');
      return;
    }

    if (!validate()) {
      return;
    }

    setUploading(true);

    try {
      const result = await photosApi.uploadStagePhoto(
        selectedStageId,
        selectedFile,
        photoType,
        caption || undefined
      );

      if (result.success) {
        toast.success('Photo uploaded successfully');
        onUploadComplete();
        handleClose();
      } else {
        toast.error(result.error || 'Failed to upload photo');
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      // Try to extract error message from axios error response
      let errorMessage = 'Failed to upload photo';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      }
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogDescription>
            Add a photo to track your tumbling progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo Preview / Upload Area */}
          {preview ? (
            <div className="relative bg-muted rounded-lg">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-contain rounded-lg"
              />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to select a photo
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 10MB, JPG/PNG/GIF/WebP
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Stage Selection */}
          <div className="space-y-2">
            <Label htmlFor="stage">
              Stage <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId}>
              <SelectTrigger className={cn(errors.stage && 'border-destructive')}>
                <SelectValue placeholder="Select stage..." />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.stageRunId} value={stage.stageRunId}>
                    {formatStageDisplayName(stage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stage && (
              <p className="text-sm text-destructive">{errors.stage}</p>
            )}
          </div>

          {/* Photo Type Selection */}
          <div className="space-y-2">
            <Label>
              Photo Type <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              {(['before', 'during', 'after'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={photoType === type ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 capitalize"
                  onClick={() => setPhotoType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
            {errors.photoType && (
              <p className="text-sm text-destructive">{errors.photoType}</p>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a description..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
