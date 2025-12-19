'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { StageFormDesktop } from './stage-form.desktop';
import { StageFormMobile } from './stage-form.mobile';
import type { StageFormProps } from './types';

/**
 * Smart stage form component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dialog modal)
 */
export function StageFormModal(props: StageFormProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <StageFormMobile {...props} />;
  }

  return <StageFormDesktop {...props} />;
}

// Re-export types for consumers
export type { StageFormProps, BarrelInfo, MaterialSelection, CleaningRunData } from './types';

// Also export individual components for testing or direct use
export { StageFormDesktop } from './stage-form.desktop';
export { StageFormMobile } from './stage-form.mobile';
