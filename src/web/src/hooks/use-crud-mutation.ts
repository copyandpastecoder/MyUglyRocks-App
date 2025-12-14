'use client';

import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Options for creating a CRUD mutation hook
 */
interface CrudMutationOptions<TData, TVariables> {
  /** The mutation function to call */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast (or function to extract from error) */
  errorMessage?: string | ((error: Error) => string);
  /** Callback on success */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Callback on error */
  onError?: (error: Error, variables: TVariables) => void;
}

/**
 * Factory hook for creating CRUD mutations with standard patterns.
 * Reduces boilerplate for create/update/delete operations.
 *
 * @example
 * ```tsx
 * const createMutation = useCrudMutation({
 *   mutationFn: (data: CreateRequest) => api.create(data),
 *   invalidateKeys: [queryKeys.items.all],
 *   successMessage: 'Item created successfully',
 *   errorMessage: 'Failed to create item',
 * });
 * ```
 */
export function useCrudMutation<TData, TVariables>({
  mutationFn,
  invalidateKeys = [],
  successMessage,
  errorMessage = 'An error occurred',
  onSuccess,
  onError,
}: CrudMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate specified query keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Show success toast if message provided
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom success handler
      onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      // Show error toast
      const message = typeof errorMessage === 'function'
        ? errorMessage(error)
        : errorMessage;
      toast.error(message);

      // Call custom error handler
      onError?.(error, variables);
    },
  });
}

/**
 * Options for creating a CRUD mutation with ID
 */
interface CrudMutationWithIdOptions<TData, TUpdateData> {
  /** The mutation function to call */
  mutationFn: (params: { id: string; data: TUpdateData }) => Promise<TData>;
  /** Function to get query keys to invalidate (receives the id) */
  getInvalidateKeys?: (id: string) => QueryKey[];
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast */
  errorMessage?: string;
  /** Callback on success */
  onSuccess?: (data: TData, variables: { id: string; data: TUpdateData }) => void;
}

/**
 * Factory hook for update mutations that take an ID and data.
 *
 * @example
 * ```tsx
 * const updateMutation = useCrudMutationWithId({
 *   mutationFn: ({ id, data }) => api.update(id, data),
 *   getInvalidateKeys: (id) => [queryKeys.items.detail(id), queryKeys.items.lists()],
 *   successMessage: 'Item updated successfully',
 *   errorMessage: 'Failed to update item',
 * });
 *
 * // Usage:
 * updateMutation.mutate({ id: '123', data: { name: 'New Name' } });
 * ```
 */
export function useCrudMutationWithId<TData, TUpdateData>({
  mutationFn,
  getInvalidateKeys,
  successMessage,
  errorMessage = 'An error occurred',
  onSuccess,
}: CrudMutationWithIdOptions<TData, TUpdateData>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate specified query keys
      if (getInvalidateKeys) {
        const keys = getInvalidateKeys(variables.id);
        keys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Show success toast if message provided
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom success handler
      onSuccess?.(data, variables);
    },
    onError: (error: Error) => {
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'An error occurred');
    },
  });
}

/**
 * Options for delete mutation
 */
interface DeleteMutationOptions {
  /** The delete function to call */
  mutationFn: (id: string) => Promise<void>;
  /** Query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast */
  errorMessage?: string;
  /** Callback on success */
  onSuccess?: (id: string) => void;
}

/**
 * Factory hook for delete mutations.
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteMutation({
 *   mutationFn: (id) => api.delete(id),
 *   invalidateKeys: [queryKeys.items.all],
 *   successMessage: 'Item deleted successfully',
 *   errorMessage: 'Failed to delete item',
 * });
 * ```
 */
export function useDeleteMutation({
  mutationFn,
  invalidateKeys = [],
  successMessage,
  errorMessage = 'Failed to delete',
  onSuccess,
}: DeleteMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (_data, id) => {
      // Invalidate specified query keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Show success toast if message provided
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom success handler
      onSuccess?.(id);
    },
    onError: () => {
      toast.error(errorMessage);
    },
  });
}
