'use client';

import { useState, useEffect } from 'react';

/**
 * Threshold for detecting phones vs tablets/desktops.
 * All phones have a smaller dimension (height in landscape, width in portrait) under 500px.
 * Tablets start at 768px (iPad Mini).
 */
const PHONE_MAX_DIMENSION = 500;

/**
 * Hook to detect if the current device is a phone.
 *
 * Uses the smaller screen dimension to detect phones regardless of orientation:
 * - Phone portrait (375w x 812h) → min=375 → Mobile ✓
 * - Phone landscape (812w x 375h) → min=375 → Mobile ✓
 * - Tablet/Desktop → min >= 768 → Desktop ✓
 *
 * @returns {boolean} true if on a phone, false for tablets and desktops
 */
export function useIsMobile(): boolean {
  // Default to false (desktop) for SSR - will update on client
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
      setIsMobile(smallerDimension < PHONE_MAX_DIMENSION);
    };

    // Check immediately
    checkIsMobile();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkIsMobile);
    window.addEventListener('orientationchange', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.removeEventListener('orientationchange', checkIsMobile);
    };
  }, []);

  return isMobile;
}
