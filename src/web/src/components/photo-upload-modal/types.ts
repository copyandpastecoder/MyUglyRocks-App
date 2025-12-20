import type { StageRunSummaryDto } from '@/types/cycle';

export type PhotoType = 'before' | 'during' | 'after' | 'inventory';

export interface PhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: StageRunSummaryDto[];
  onUploadComplete: () => void;
  defaultStageId?: string;
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
