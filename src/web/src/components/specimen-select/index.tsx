'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { SpecimenSelectDesktop } from './specimen-select.desktop';
import { SpecimenSelectMobile } from './specimen-select.mobile';
import type { SpecimenSelectProps } from './types';

/**
 * Smart specimen select component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (full-screen sheet)
 * - Tablets and desktops: Desktop UI (dropdown popover)
 */
export function SpecimenMultiSelect(props: SpecimenSelectProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SpecimenSelectMobile {...props} />;
  }

  return <SpecimenSelectDesktop {...props} />;
}

// Re-export types for consumers
export type { SpecimenSelectProps, SpecimenSelection } from './types';

// Also export individual components for testing or direct use
export { SpecimenSelectDesktop } from './specimen-select.desktop';
export { SpecimenSelectMobile } from './specimen-select.mobile';
