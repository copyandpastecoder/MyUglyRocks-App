'use client';

import { useQuery } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';

/**
 * Hook to fetch cycle statistics for the current user.
 *
 * Error handling:
 * - 401 Unauthorized: Handled by axios interceptor (auto token refresh, redirect to login)
 * - Other errors: Exposed via `error` and `isError` from returned query object
 *
 * @example
 * const { data, isLoading, error, isError } = useCycleStatistics();
 * if (isError) {
 *   // Handle error - could be network error, 500 server error, etc.
 * }
 */
export function useCycleStatistics() {
  return useQuery({
    queryKey: queryKeys.cycles.statistics(),
    queryFn: () => cycleApi.getStatistics(),
    ...cacheConfig.userData,
  });
}
