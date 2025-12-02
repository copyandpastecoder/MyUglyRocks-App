'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { ResolveReportRequest, ChangeUserRoleRequest, BanUserRequest, CreateSpecimenRequest, UpdateSpecimenRequest, CreateMaterialRequest, UpdateMaterialRequest } from '@/types/admin';

/**
 * Hook to fetch admin dashboard stats
 */
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: adminApi.getStats,
    ...cacheConfig.admin,
  });
}

// Reports
export function useReports(status?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: queryKeys.admin.reports({ status, page }),
    queryFn: () => adminApi.getReports(status, page, pageSize),
    ...cacheConfig.admin,
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: queryKeys.admin.report(id!),
    queryFn: () => adminApi.getReport(id!),
    enabled: !!id,
    ...cacheConfig.admin,
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: ResolveReportRequest }) =>
      adminApi.resolveReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Report resolved');
    },
    onError: () => {
      toast.error('Failed to resolve report');
    },
  });
}

export function useAdminDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => adminApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });
}

// Users
export function useAdminUsers(
  search?: string,
  role?: string,
  isActive?: boolean,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: queryKeys.admin.users({ search, role, isActive, page }),
    queryFn: () => adminApi.getUsers(search, role, isActive, page, pageSize),
    ...cacheConfig.admin,
  });
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: queryKeys.admin.user(id!),
    queryFn: () => adminApi.getUser(id!),
    enabled: !!id,
    ...cacheConfig.admin,
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangeUserRoleRequest }) =>
      adminApi.changeUserRole(userId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
      toast.success('User role updated');
    },
    onError: () => {
      toast.error('Failed to update user role');
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: BanUserRequest }) =>
      adminApi.banUser(userId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
      toast.success('User banned');
    },
    onError: () => {
      toast.error('Failed to ban user');
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users({}) });
      toast.success('User unbanned');
    },
    onError: () => {
      toast.error('Failed to unban user');
    },
  });
}

// Admin Specimens
export function useAdminSpecimens(
  search?: string,
  materialType?: string,
  isActive?: boolean,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: queryKeys.admin.specimens({ search, materialType, isActive, page }),
    queryFn: () => adminApi.getSpecimens(search, materialType, isActive, page, pageSize),
    ...cacheConfig.admin,
  });
}

export function useCreateSpecimen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpecimenRequest) => adminApi.createSpecimen(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.specimens({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.specimens.all });
      toast.success('Specimen created');
    },
    onError: () => {
      toast.error('Failed to create specimen');
    },
  });
}

export function useUpdateSpecimen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpecimenRequest }) =>
      adminApi.updateSpecimen(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.specimens({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.specimens.all });
      toast.success('Specimen updated');
    },
    onError: () => {
      toast.error('Failed to update specimen');
    },
  });
}

export function useDeleteSpecimen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSpecimen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.specimens({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.specimens.all });
      toast.success('Specimen deleted');
    },
    onError: () => {
      toast.error('Failed to delete specimen');
    },
  });
}

// Admin Materials
export function useAdminMaterials(
  search?: string,
  category?: string,
  isActive?: boolean,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: queryKeys.admin.materials({ search, category, isActive, page }),
    queryFn: () => adminApi.getMaterials(search, category, isActive, page, pageSize),
    ...cacheConfig.admin,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaterialRequest) => adminApi.createMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.materials({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success('Material created');
    },
    onError: () => {
      toast.error('Failed to create material');
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialRequest }) =>
      adminApi.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.materials({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success('Material updated');
    },
    onError: () => {
      toast.error('Failed to update material');
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.materials({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      toast.success('Material deleted');
    },
    onError: () => {
      toast.error('Failed to delete material');
    },
  });
}
