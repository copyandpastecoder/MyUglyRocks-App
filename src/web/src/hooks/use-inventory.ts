'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type {
  CreateInventoryRequest,
  UpdateInventoryRequest,
  UpdateInventoryStatusRequest,
  UpdateInventorySpecimensRequest,
  InventoryFilters,
} from '@/types/inventory';

/**
 * Hook to fetch all inventory items with optional filters
 */
export function useInventory(filters?: InventoryFilters, skip = 0, take = 20) {
  return useQuery({
    queryKey: queryKeys.inventory.list(filters),
    queryFn: () => inventoryApi.getAll(filters, skip, take),
    placeholderData: keepPreviousData,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch a single inventory item by ID
 */
export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: queryKeys.inventory.detail(id!),
    queryFn: () => inventoryApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch inventory statistics
 */
export function useInventoryStats() {
  return useQuery({
    queryKey: queryKeys.inventory.stats(),
    queryFn: () => inventoryApi.getStats(),
    ...cacheConfig.userData,
  });
}

/**
 * Hook for creating inventory items
 */
export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryRequest) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      toast.success('Inventory item added');
    },
    onError: () => {
      toast.error('Failed to add inventory item');
    },
  });
}

/**
 * Hook for updating inventory items
 */
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryRequest }) =>
      inventoryApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.stats() });
      toast.success('Inventory item updated');
    },
    onError: () => {
      toast.error('Failed to update inventory item');
    },
  });
}

/**
 * Hook for deleting inventory items
 */
export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      toast.success('Inventory item deleted');
    },
    onError: () => {
      toast.error('Failed to delete inventory item');
    },
  });
}

/**
 * Hook for updating inventory status
 */
export function useUpdateInventoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryStatusRequest }) =>
      inventoryApi.updateStatus(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.stats() });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });
}

/**
 * Hook for updating inventory specimens
 */
export function useUpdateInventorySpecimens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventorySpecimensRequest }) =>
      inventoryApi.updateSpecimens(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.id) });
      toast.success('Specimens updated');
    },
    onError: () => {
      toast.error('Failed to update specimens');
    },
  });
}

/**
 * Hook for uploading inventory photos
 */
export function useUploadInventoryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventoryId, file, caption, isCover, inventorySpecimenId }: {
      inventoryId: string;
      file: File;
      caption?: string;
      isCover?: boolean;
      inventorySpecimenId?: string;
    }) => inventoryApi.uploadPhoto(inventoryId, file, caption, isCover, inventorySpecimenId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.inventoryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      toast.success('Photo uploaded');
    },
    onError: () => {
      toast.error('Failed to upload photo');
    },
  });
}

/**
 * Hook for deleting inventory photos
 */
export function useDeleteInventoryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId }: { inventoryId: string; photoId: string }) =>
      inventoryApi.deletePhoto(photoId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.inventoryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      toast.success('Photo deleted');
    },
    onError: () => {
      toast.error('Failed to delete photo');
    },
  });
}

/**
 * Hook for setting cover photo
 */
export function useSetInventoryCoverPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventoryId, photoId }: { inventoryId: string; photoId: string }) =>
      inventoryApi.setCoverPhoto(inventoryId, photoId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.inventoryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lists() });
      toast.success('Cover photo updated');
    },
    onError: () => {
      toast.error('Failed to set cover photo');
    },
  });
}

/**
 * Hook for updating inventory photo (specimen tag and caption)
 */
export function useUpdateInventoryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      photoId,
      data,
    }: {
      inventoryId: string;
      photoId: string;
      data: { inventorySpecimenId?: string | null; caption?: string | null };
    }) => inventoryApi.updatePhoto(photoId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(variables.inventoryId) });
      toast.success('Photo updated');
    },
    onError: () => {
      toast.error('Failed to update photo');
    },
  });
}
