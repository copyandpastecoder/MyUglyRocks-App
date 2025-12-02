'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { CreateCycleRequest, UpdateCycleRequest, CompleteCycleRequest, CreateStageRunRequest } from '@/types/cycle';

/**
 * Hook to fetch all cycles with optional status filter
 */
export function useCycles(status?: string) {
  return useQuery({
    queryKey: queryKeys.cycles.list({ status }),
    queryFn: () => cycleApi.getAll(status),
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch a single cycle by ID
 */
export function useCycle(id: string | null) {
  return useQuery({
    queryKey: queryKeys.cycles.detail(id!),
    queryFn: () => cycleApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch a stage run by ID
 */
export function useStageRun(id: string | null) {
  return useQuery({
    queryKey: queryKeys.cycles.stageRun(id!),
    queryFn: () => cycleApi.getStageRun(id!),
    enabled: !!id,
    ...cacheConfig.userData,
  });
}

/**
 * Hook for creating cycles
 */
export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCycleRequest) => cycleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
      toast.success('Cycle created successfully');
    },
    onError: () => {
      toast.error('Failed to create cycle');
    },
  });
}

/**
 * Hook for updating cycles
 */
export function useUpdateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCycleRequest }) =>
      cycleApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.lists() });
      toast.success('Cycle updated successfully');
    },
    onError: () => {
      toast.error('Failed to update cycle');
    },
  });
}

/**
 * Hook for deleting cycles
 */
export function useDeleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cycleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
      toast.success('Cycle deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete cycle');
    },
  });
}

/**
 * Hook for completing cycles
 */
export function useCompleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteCycleRequest }) =>
      cycleApi.complete(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.lists() });
      toast.success('Cycle completed! Ready to share.');
    },
    onError: () => {
      toast.error('Failed to complete cycle');
    },
  });
}

/**
 * Hook for archiving cycles
 */
export function useArchiveCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cycleApi.archive(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.lists() });
      toast.success('Cycle archived');
    },
    onError: () => {
      toast.error('Failed to archive cycle');
    },
  });
}

/**
 * Hook for adding stage runs
 */
export function useAddStageRun(cycleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStageRunRequest) => cycleApi.addStageRun(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.detail(cycleId) });
      toast.success('Stage started');
    },
    onError: () => {
      toast.error('Failed to add stage');
    },
  });
}

/**
 * Hook for completing stage runs
 */
export function useCompleteStageRun(cycleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: object }) =>
      cycleApi.completeStageRun(stageId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.detail(cycleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.stageRun(variables.stageId) });
      toast.success('Stage completed');
    },
    onError: () => {
      toast.error('Failed to complete stage');
    },
  });
}

/**
 * Hook for deleting stage runs
 */
export function useDeleteStageRun(cycleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stageId: string) => cycleApi.deleteStageRun(stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cycles.detail(cycleId) });
      toast.success('Stage deleted');
    },
    onError: () => {
      toast.error('Failed to delete stage');
    },
  });
}
