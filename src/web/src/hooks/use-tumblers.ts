'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tumblerApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { CreateTumblerRequest, UpdateTumblerRequest, CreateBarrelRequest, UpdateBarrelRequest } from '@/types/tumbler';

/**
 * Hook to fetch all user's tumblers
 */
export function useTumblers() {
  return useQuery({
    queryKey: queryKeys.tumblers.list(),
    queryFn: tumblerApi.getAll,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch all tumblers with barrel details
 */
export function useTumblersWithBarrels() {
  return useQuery({
    queryKey: [...queryKeys.tumblers.list(), 'withBarrels'],
    queryFn: tumblerApi.getAllWithBarrels,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch a single tumbler by ID
 */
export function useTumbler(id: string | null) {
  return useQuery({
    queryKey: queryKeys.tumblers.detail(id!),
    queryFn: () => tumblerApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch tumbler models (reference data)
 */
export function useTumblerModels() {
  return useQuery({
    queryKey: queryKeys.tumblers.models(),
    queryFn: tumblerApi.getModels,
    ...cacheConfig.referenceData,
  });
}

/**
 * Hook for creating tumblers
 */
export function useCreateTumbler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTumblerRequest) => tumblerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.all });
      toast.success('Tumbler created successfully');
    },
    onError: () => {
      toast.error('Failed to create tumbler');
    },
  });
}

/**
 * Hook for updating tumblers
 */
export function useUpdateTumbler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTumblerRequest }) =>
      tumblerApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.lists() });
      toast.success('Tumbler updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tumbler');
    },
  });
}

/**
 * Hook for deleting tumblers
 */
export function useDeleteTumbler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tumblerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.all });
      toast.success('Tumbler deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete tumbler');
    },
  });
}

/**
 * Hook for adding barrels to a tumbler
 */
export function useAddBarrel(tumblerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBarrelRequest) => tumblerApi.addBarrel(tumblerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.detail(tumblerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.lists() });
      toast.success('Barrel added successfully');
    },
    onError: () => {
      toast.error('Failed to add barrel');
    },
  });
}

/**
 * Hook for updating barrels
 */
export function useUpdateBarrel(tumblerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ barrelId, data }: { barrelId: string; data: UpdateBarrelRequest }) =>
      tumblerApi.updateBarrel(barrelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.detail(tumblerId) });
      toast.success('Barrel updated successfully');
    },
    onError: () => {
      toast.error('Failed to update barrel');
    },
  });
}

/**
 * Hook for deleting barrels
 */
export function useDeleteBarrel(tumblerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barrelId: string) => tumblerApi.deleteBarrel(barrelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.detail(tumblerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tumblers.lists() });
      toast.success('Barrel deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete barrel');
    },
  });
}
