'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { UpdateProfileRequest, ChangePasswordRequest, UpdateSettingsRequest, DeactivateAccountRequest } from '@/types/user';

/**
 * Hook to fetch user profile
 * Uses short cache time for user-specific data
 */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: userApi.getProfile,
    ...cacheConfig.userProfile,
  });
}

/**
 * Hook to fetch user settings
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: userApi.getSettings,
    ...cacheConfig.userProfile,
  });
}

/**
 * Hook to fetch user stats
 */
export function useStats() {
  return useQuery({
    queryKey: queryKeys.user.stats(),
    queryFn: userApi.getStats,
    ...cacheConfig.userData,
  });
}

/**
 * Hook for updating profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}

/**
 * Hook for uploading avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Avatar uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload avatar');
    },
  });
}

/**
 * Hook for updating settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) => userApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.settings() });
      toast.success('Settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });
}

/**
 * Hook for changing password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => userApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: () => {
      toast.error('Failed to change password. Please check your current password.');
    },
  });
}

/**
 * Hook for deactivating account
 */
export function useDeactivateAccount() {
  return useMutation({
    mutationFn: (data: DeactivateAccountRequest) => userApi.deactivateAccount(data),
    onSuccess: () => {
      toast.success('Account deactivated');
      window.location.href = '/';
    },
    onError: () => {
      toast.error('Failed to deactivate account');
    },
  });
}
