'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { DurationPickerDesktop } from './duration-picker.desktop';
import { DurationPickerMobile } from './duration-picker.mobile';
import type { DurationPickerProps } from './types';

/**
 * Smart duration picker component that renders the appropriate version
 * based on device type:
 * - Phones (portrait or landscape): Mobile UI (larger touch targets)
 * - Tablets and desktops: Desktop UI (compact inputs)
 */
export function DurationPicker(props: DurationPickerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DurationPickerMobile {...props} />;
  }

  return <DurationPickerDesktop {...props} />;
}

// Re-export types for consumers
export type { DurationPickerProps } from './types';

// Also export individual components for testing or direct use
export { DurationPickerDesktop } from './duration-picker.desktop';
export { DurationPickerMobile } from './duration-picker.mobile';
