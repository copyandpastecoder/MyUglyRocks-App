'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { InventoryPhotoEditDialogDesktop } from './inventory-photo-edit-dialog.desktop';
import { InventoryPhotoEditDialogMobile } from './inventory-photo-edit-dialog.mobile';
import type { InventoryPhotoEditDialogProps } from './types';

/**
 * Smart inventory photo edit dialog component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function InventoryPhotoEditDialog(props: InventoryPhotoEditDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <InventoryPhotoEditDialogMobile {...props} />;
  }

  return <InventoryPhotoEditDialogDesktop {...props} />;
}

// Re-export types for consumers
export type { InventoryPhotoEditDialogProps } from './types';

// Also export individual components for testing or direct use
export { InventoryPhotoEditDialogDesktop } from './inventory-photo-edit-dialog.desktop';
export { InventoryPhotoEditDialogMobile } from './inventory-photo-edit-dialog.mobile';
