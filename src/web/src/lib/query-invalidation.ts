/**
 * Query invalidation helpers for consistent cache management.
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate cycle-related queries after mutations.
 * @param queryClient - The React Query client
 * @param cycleId - Optional specific cycle ID to invalidate
 */
export function invalidateCycleQueries(queryClient: QueryClient, cycleId?: string): void {
  if (cycleId) {
    queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
  }
  queryClient.invalidateQueries({ queryKey: ['cycles'] });
}

/**
 * Invalidate tumbler-related queries after mutations.
 * @param queryClient - The React Query client
 * @param tumblerId - Optional specific tumbler ID to invalidate
 */
export function invalidateTumblerQueries(queryClient: QueryClient, tumblerId?: string): void {
  if (tumblerId) {
    queryClient.invalidateQueries({ queryKey: ['tumbler', tumblerId] });
  }
  queryClient.invalidateQueries({ queryKey: ['tumblers'] });
}
