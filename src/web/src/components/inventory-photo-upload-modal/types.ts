import type { InventorySpecimenDto } from '@/types/inventory';

export interface InventoryPhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryId: string;
  specimens: InventorySpecimenDto[];
  onUploadComplete: () => void;
}

// Safe image MIME types - excludes SVG which can contain scripts
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];
