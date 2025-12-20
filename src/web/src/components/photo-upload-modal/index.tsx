'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { PhotoUploadModalDesktop } from './photo-upload-modal.desktop';
import { PhotoUploadModalMobile } from './photo-upload-modal.mobile';
import type { PhotoUploadModalProps } from './types';

/**
 * Smart photo upload modal component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function PhotoUploadModal(props: PhotoUploadModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <PhotoUploadModalMobile {...props} />;
  }

  return <PhotoUploadModalDesktop {...props} />;
}

// Re-export types for consumers
export type { PhotoUploadModalProps, PhotoType } from './types';

// Also export individual components for testing or direct use
export { PhotoUploadModalDesktop } from './photo-upload-modal.desktop';
export { PhotoUploadModalMobile } from './photo-upload-modal.mobile';
