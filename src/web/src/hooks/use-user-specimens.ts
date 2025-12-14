'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userSpecimenApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type {
  CreateUserSpecimenRequest,
  UpdateUserSpecimenRequest,
  UserSpecimenFilters,
} from '@/types/user-specimen';

/**
 * Hook to fetch all user specimens with optional filters
 */
export function useUserSpecimens(filters?: UserSpecimenFilters, skip = 0, take = 20) {
  return useQuery({
    queryKey: queryKeys.userSpecimens.list(filters),
    queryFn: () => userSpecimenApi.getAll(filters, skip, take),
    ...cacheConfig.userData,
  });
}

/**
 * Hook to fetch a single user specimen by ID
 */
export function useUserSpecimen(id: string | null) {
  return useQuery({
    queryKey: queryKeys.userSpecimens.detail(id!),
    queryFn: () => userSpecimenApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.userData,
  });
}

/**
 * Hook to search all specimens (system + user + public) for specimen picker
 */
export function useSpecimenSearch(search?: string, includePublic = true) {
  return useQuery({
    queryKey: queryKeys.userSpecimens.search(search, includePublic),
    queryFn: () => userSpecimenApi.searchAll(search, includePublic),
    ...cacheConfig.userData,
  });
}

/**
 * Hook for creating user specimens
 */
export function useCreateUserSpecimen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserSpecimenRequest) => userSpecimenApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userSpecimens.all });
      toast.success('Custom specimen created');
    },
    onError: () => {
      toast.error('Failed to create custom specimen');
    },
  });
}

/**
 * Hook for updating user specimens
 */
export function useUpdateUserSpecimen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserSpecimenRequest }) =>
      userSpecimenApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userSpecimens.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userSpecimens.lists() });
      toast.success('Custom specimen updated');
    },
    onError: () => {
      toast.error('Failed to update custom specimen');
    },
  });
}

/**
 * Hook for deleting user specimens
 */
export function useDeleteUserSpecimen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userSpecimenApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userSpecimens.all });
      toast.success('Custom specimen deleted');
    },
    onError: () => {
      toast.error('Failed to delete custom specimen');
    },
  });
}
