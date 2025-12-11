/**
 * Shared layout constants for consistent page widths across the app.
 * Change CONTENT_MAX_WIDTH to adjust all pages at once.
 */

// Main content max-width class - change this to adjust all pages
export const CONTENT_MAX_WIDTH = 'max-w-3xl';

// Combined class for page containers (max-width + centering + spacing)
export const PAGE_CONTAINER = `${CONTENT_MAX_WIDTH} mx-auto space-y-6`;

// Alternative spacing variants
export const PAGE_CONTAINER_TIGHT = `${CONTENT_MAX_WIDTH} mx-auto space-y-4`;
export const PAGE_CONTAINER_LOOSE = `${CONTENT_MAX_WIDTH} mx-auto space-y-8`;
