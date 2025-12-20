'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { InventorySourceFormDialogDesktop } from './inventory-source-form-dialog.desktop';
import { InventorySourceFormDialogMobile } from './inventory-source-form-dialog.mobile';
import type { InventorySourceFormDialogProps } from './types';

/**
 * Smart inventory source form dialog component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function InventorySourceFormDialog(props: InventorySourceFormDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <InventorySourceFormDialogMobile {...props} />;
  }

  return <InventorySourceFormDialogDesktop {...props} />;
}

// Re-export types for consumers
export type { InventorySourceFormDialogProps } from './types';

// Also export individual components for testing or direct use
export { InventorySourceFormDialogDesktop } from './inventory-source-form-dialog.desktop';
export { InventorySourceFormDialogMobile } from './inventory-source-form-dialog.mobile';
