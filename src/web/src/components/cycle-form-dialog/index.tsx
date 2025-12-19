'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { CycleFormDialogDesktop } from './cycle-form-dialog.desktop';
import { CycleFormDialogMobile } from './cycle-form-dialog.mobile';
import type { CycleFormDialogProps } from './types';

/**
 * Smart cycle form dialog component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function CycleFormDialog(props: CycleFormDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <CycleFormDialogMobile {...props} />;
  }

  return <CycleFormDialogDesktop {...props} />;
}

// Re-export types for consumers
export type { CycleFormDialogProps } from './types';

// Also export individual components for testing or direct use
export { CycleFormDialogDesktop } from './cycle-form-dialog.desktop';
export { CycleFormDialogMobile } from './cycle-form-dialog.mobile';
