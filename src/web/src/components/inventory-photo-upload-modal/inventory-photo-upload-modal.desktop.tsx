'use client';

import { useState, useRef, useEffect, useMemo, startTransition } from 'react';
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
import { useUploadInventoryPhoto } from '@/hooks/use-inventory';
import { cn } from '@/lib/utils';
import type { InventoryPhotoUploadModalProps } from './types';
import { ALLOWED_IMAGE_TYPES } from './types';

export function InventoryPhotoUploadModalDesktop({
  open,
  onOpenChange,
  inventoryId,
  specimens,
  onUploadComplete,
}: InventoryPhotoUploadModalProps) {
  // Auto-select specimen if there's only one
  const defaultSpecimenId = specimens.length === 1 ? specimens[0].inventorySpecimenId : '__none__';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>(defaultSpecimenId);
  const [caption, setCaption] = useState('');
  const [errors, setErrors] = useState<{ specimen?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadInventoryPhoto();

  // Sort specimens alphabetically by name
  const sortedSpecimens = useMemo(() => {
    return [...specimens].sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [specimens]);

  // Update default selection when modal opens or specimens change
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setSelectedSpecimenId(defaultSpecimenId);
      });
    }
  }, [open, defaultSpecimenId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setSelectedSpecimenId(defaultSpecimenId);
    setCaption('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo');
      return;
    }

    setErrors({});

    try {
      await uploadMutation.mutateAsync({
        inventoryId,
        file: selectedFile,
        caption: caption || undefined,
        inventorySpecimenId: selectedSpecimenId && selectedSpecimenId !== '__none__' ? selectedSpecimenId : undefined,
      });
      onUploadComplete();
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogDescription>
            Add a photo to your inventory item
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

          {/* Specimen Selection (Optional) */}
          {specimens.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="specimen">
                Tag Specimen <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Select value={selectedSpecimenId} onValueChange={setSelectedSpecimenId}>
                <SelectTrigger className={cn(errors.specimen && 'border-destructive')}>
                  <SelectValue placeholder="Select a specimen to tag..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (general photo)</SelectItem>
                  {sortedSpecimens.map((specimen) => (
                    <SelectItem key={specimen.inventorySpecimenId} value={specimen.inventorySpecimenId}>
                      {specimen.commonName}
                      {specimen.scientificName && (
                        <span className="text-muted-foreground ml-2">({specimen.scientificName})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optionally link this photo to a specific specimen
              </p>
              {errors.specimen && (
                <p className="text-sm text-destructive">{errors.specimen}</p>
              )}
            </div>
          )}

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
          <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploadMutation.isPending || !selectedFile}>
            {uploadMutation.isPending ? (
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
