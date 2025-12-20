'use client';

import { useState, useRef, useEffect, useMemo, startTransition } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

export function InventoryPhotoUploadModalMobile({
  open,
  onOpenChange,
  inventoryId,
  specimens,
  onUploadComplete,
}: InventoryPhotoUploadModalProps) {
  const defaultSpecimenId = specimens.length === 1 ? specimens[0].inventorySpecimenId : '__none__';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>(defaultSpecimenId);
  const [caption, setCaption] = useState('');
  const [errors, setErrors] = useState<{ specimen?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadInventoryPhoto();

  const sortedSpecimens = useMemo(() => {
    return [...specimens].sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [specimens]);

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
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>Upload Photo</SheetTitle>
          <SheetDescription>
            Add a photo to your inventory item
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Photo Preview / Upload Area */}
          {preview ? (
            <div className="relative bg-muted rounded-lg">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-56 object-contain rounded-lg"
              />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors active:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
              <p className="text-base text-muted-foreground">
                Tap to select a photo
              </p>
              <p className="text-sm text-muted-foreground mt-1">
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
              <Label className="text-base font-semibold">
                Tag Specimen <span className="text-muted-foreground text-sm font-normal">(optional)</span>
              </Label>
              <Select value={selectedSpecimenId} onValueChange={setSelectedSpecimenId}>
                <SelectTrigger className={cn("h-12 text-base", errors.specimen && 'border-destructive')}>
                  <SelectValue placeholder="Select a specimen to tag..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="py-3">None (general photo)</SelectItem>
                  {sortedSpecimens.map((specimen) => (
                    <SelectItem key={specimen.inventorySpecimenId} value={specimen.inventorySpecimenId} className="py-3">
                      {specimen.commonName}
                      {specimen.scientificName && (
                        <span className="text-muted-foreground ml-2">({specimen.scientificName})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Optionally link this photo to a specific specimen
              </p>
              {errors.specimen && (
                <p className="text-sm text-destructive">{errors.specimen}</p>
              )}
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Caption (optional)</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="text-base"
            />
          </div>
        </div>

        <SheetFooter className="p-4 border-t bg-background">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !selectedFile}
              className="flex-1 h-12 text-base"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
