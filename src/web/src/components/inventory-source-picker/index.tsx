'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { InventorySourcePickerDesktop } from './inventory-source-picker.desktop';
import { InventorySourcePickerMobile } from './inventory-source-picker.mobile';
import type { InventorySourcePickerProps } from './types';

/**
 * Smart inventory source picker component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (popover dropdown)
 */
export function InventorySourcePicker(props: InventorySourcePickerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <InventorySourcePickerMobile {...props} />;
  }

  return <InventorySourcePickerDesktop {...props} />;
}

// Re-export types for consumers
export type { InventorySourcePickerProps } from './types';

// Also export individual components for testing or direct use
export { InventorySourcePickerDesktop } from './inventory-source-picker.desktop';
export { InventorySourcePickerMobile } from './inventory-source-picker.mobile';
