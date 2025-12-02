'use client';

import { useQuery } from '@tanstack/react-query';
import { specimenApi, barrelNicknameApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import type { SpecimenSearchRequest } from '@/types/reference';

/**
 * Hook to fetch all specimens with optional filters
 * Uses long cache time since reference data rarely changes
 */
export function useSpecimens(filters?: SpecimenSearchRequest) {
  return useQuery({
    queryKey: queryKeys.specimens.list(filters),
    queryFn: () => specimenApi.getAll(filters),
    ...cacheConfig.referenceData,
  });
}

/**
 * Hook to fetch a single specimen by ID
 */
export function useSpecimen(id: string | null) {
  return useQuery({
    queryKey: queryKeys.specimens.detail(id!),
    queryFn: () => specimenApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.referenceData,
  });
}

/**
 * Hook to fetch all barrel nicknames
 * Uses long cache time since reference data rarely changes
 */
export function useBarrelNicknames() {
  return useQuery({
    queryKey: queryKeys.barrelNicknames.list(),
    queryFn: () => barrelNicknameApi.getAll(),
    ...cacheConfig.referenceData,
  });
}
