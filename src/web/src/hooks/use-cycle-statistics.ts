'use client';

import { useQuery } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';

/**
 * Hook to fetch cycle statistics for the current user
 */
export function useCycleStatistics() {
  return useQuery({
    queryKey: queryKeys.cycles.statistics(),
    queryFn: () => cycleApi.getStatistics(),
    ...cacheConfig.userData,
  });
}
