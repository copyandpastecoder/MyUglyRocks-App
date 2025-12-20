'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { AddCustomSpecimenDialogDesktop } from './add-custom-specimen-dialog.desktop';
import { AddCustomSpecimenDialogMobile } from './add-custom-specimen-dialog.mobile';
import type { AddCustomSpecimenDialogProps } from './types';

/**
 * Smart add custom specimen dialog component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function AddCustomSpecimenDialog(props: AddCustomSpecimenDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <AddCustomSpecimenDialogMobile {...props} />;
  }

  return <AddCustomSpecimenDialogDesktop {...props} />;
}

// Re-export types for consumers
export type { AddCustomSpecimenDialogProps, CustomSpecimenCreatedData } from './types';

// Also export individual components for testing or direct use
export { AddCustomSpecimenDialogDesktop } from './add-custom-specimen-dialog.desktop';
export { AddCustomSpecimenDialogMobile } from './add-custom-specimen-dialog.mobile';
