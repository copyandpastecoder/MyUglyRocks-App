'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { InventoryPhotoUploadModalDesktop } from './inventory-photo-upload-modal.desktop';
import { InventoryPhotoUploadModalMobile } from './inventory-photo-upload-modal.mobile';
import type { InventoryPhotoUploadModalProps } from './types';

/**
 * Smart inventory photo upload modal component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function InventoryPhotoUploadModal(props: InventoryPhotoUploadModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <InventoryPhotoUploadModalMobile {...props} />;
  }

  return <InventoryPhotoUploadModalDesktop {...props} />;
}

// Re-export types for consumers
export type { InventoryPhotoUploadModalProps } from './types';

// Also export individual components for testing or direct use
export { InventoryPhotoUploadModalDesktop } from './inventory-photo-upload-modal.desktop';
export { InventoryPhotoUploadModalMobile } from './inventory-photo-upload-modal.mobile';
