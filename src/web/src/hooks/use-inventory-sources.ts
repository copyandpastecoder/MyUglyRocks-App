'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { inventorySourceApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type {
  CreateInventorySourceRequest,
  UpdateInventorySourceRequest,
  InventorySourceFilters,
} from '@/types/inventory-source';

/**
 * Hook to fetch all inventory sources with optional filters
 */
export function useInventorySources(filters?: InventorySourceFilters, skip = 0, take = 50) {
  return useQuery({
    queryKey: queryKeys.inventorySources.list(filters),
    queryFn: () => inventorySourceApi.getAll(filters, skip, take),
    placeholderData: keepPreviousData,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch a single inventory source by ID
 */
export function useInventorySource(id: string | null) {
  return useQuery({
    queryKey: queryKeys.inventorySources.detail(id!),
    queryFn: () => inventorySourceApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.userData,
  });
}

/**
 * Hook for creating inventory sources
 */
export function useCreateInventorySource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventorySourceRequest) => inventorySourceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventorySources.all });
      toast.success('Source created');
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      if (error.response?.status === 409) {
        toast.error('A source with this name and type already exists');
      } else {
        toast.error('Failed to create source');
      }
    },
  });
}

/**
 * Hook for updating inventory sources
 */
export function useUpdateInventorySource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventorySourceRequest }) =>
      inventorySourceApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventorySources.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventorySources.lists() });
      // Also invalidate inventory since it displays source info
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      toast.success('Source updated');
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      if (error.response?.status === 409) {
        toast.error('A source with this name and type already exists');
      } else {
        toast.error('Failed to update source');
      }
    },
  });
}

/**
 * Hook for deleting inventory sources
 */
export function useDeleteInventorySource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventorySourceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventorySources.all });
      toast.success('Source deleted');
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      if (error.response?.status === 409) {
        toast.error('Cannot delete source with linked inventory items');
      } else {
        toast.error('Failed to delete source');
      }
    },
  });
}

/**
 * Hook to check if a source name exists
 */
export function useCheckSourceName() {
  return useMutation({
    mutationFn: ({ sourceType, name, excludeSourceId }: {
      sourceType: string;
      name: string;
      excludeSourceId?: string;
    }) => inventorySourceApi.checkName(sourceType, name, excludeSourceId),
  });
}
