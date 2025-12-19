'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { CleaningRunModalDesktop } from './cleaning-run-modal.desktop';
import { CleaningRunModalMobile } from './cleaning-run-modal.mobile';
import type { CleaningRunModalProps } from './types';

/**
 * Smart cleaning run modal component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function CleaningRunModal(props: CleaningRunModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <CleaningRunModalMobile {...props} />;
  }

  return <CleaningRunModalDesktop {...props} />;
}

// Re-export types for consumers
export type { CleaningRunModalProps } from './types';

// Also export individual components for testing or direct use
export { CleaningRunModalDesktop } from './cleaning-run-modal.desktop';
export { CleaningRunModalMobile } from './cleaning-run-modal.mobile';
