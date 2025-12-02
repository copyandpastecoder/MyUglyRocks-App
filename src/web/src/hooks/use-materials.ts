'use client';

import { useQuery } from '@tanstack/react-query';
import { materialApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import type { MaterialSearchRequest } from '@/types/reference';

/**
 * Hook to fetch all materials with optional filters
 * Uses long cache time since reference data rarely changes
 */
export function useMaterials(filters?: MaterialSearchRequest) {
  return useQuery({
    queryKey: queryKeys.materials.list(filters),
    queryFn: () => materialApi.getAll(filters),
    ...cacheConfig.referenceData,
  });
}

/**
 * Hook to fetch a single material by ID
 */
export function useMaterial(id: string | null) {
  return useQuery({
    queryKey: queryKeys.materials.detail(id!),
    queryFn: () => materialApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.referenceData,
  });
}
