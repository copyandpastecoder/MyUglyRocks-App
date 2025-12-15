'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { UpdateProfileRequest, ChangePasswordRequest, UpdateSettingsRequest, DeactivateAccountRequest } from '@/types/user';
import {
  utcToUserTimezone,
  userTimezoneToUtc,
  getNowInTimezone,
  formatInTimezone,
  isDateTodayInTimezone,
  formatUtcForDateTimeLocalInput,
  parseDateTimeLocalToUtc,
} from '@/lib/date-utils';

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

// Default timezone when settings not loaded
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Hook to get user's timezone and timezone-aware date utilities.
 * This is the primary hook for handling dates throughout the app.
 *
 * Usage:
 * ```tsx
 * const { timezone, toUserTz, toUtc, formatDate, isToday, now, formatForInput, parseFromInput } = useTimezone();
 *
 * // Display a UTC date from API in user's timezone
 * const displayDate = formatDate(stage.startDateTime, 'MMM d, yyyy h:mm a');
 *
 * // Get current time in user's timezone
 * const currentTime = now();
 *
 * // Check if a date is today
 * const isTodayInUserTz = isToday(stage.endDateTime);
 *
 * // Prepare datetime-local input value from API data
 * const inputValue = formatForInput(stage.startDateTime);
 *
 * // Convert input value to UTC for API submission
 * const utcValue = parseFromInput(inputValue);
 * ```
 */
export function useTimezone() {
  const { data: settings, isLoading } = useSettings();
  const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;

  return useMemo(() => ({
    /** User's timezone string (e.g., "America/New_York") */
    timezone,

    /** Whether settings are still loading */
    isLoading,

    /**
     * Convert UTC date string from API to Date in user's timezone
     * @param utcDateString - ISO date string from API
     * @returns Date object in user's timezone, or null if input is null/undefined
     */
    toUserTz: (utcDateString: string | null | undefined) =>
      utcToUserTimezone(utcDateString, timezone),

    /**
     * Convert local Date to UTC ISO string for API submission
     * @param localDate - Date object in user's timezone
     * @returns UTC ISO string
     */
    toUtc: (localDate: Date) =>
      userTimezoneToUtc(localDate, timezone),

    /**
     * Get current time in user's timezone
     * @returns Date object representing now in user's timezone
     */
    now: () => getNowInTimezone(timezone),

    /**
     * Format a UTC date string for display in user's timezone
     * @param utcDateString - ISO date string from API
     * @param formatStr - date-fns format string (default: "MMM d, yyyy h:mm a")
     * @returns Formatted string
     */
    formatDate: (utcDateString: string | null | undefined, formatStr?: string) =>
      formatInTimezone(utcDateString, timezone, formatStr),

    /**
     * Check if a UTC date is "today" in user's timezone
     * @param utcDateString - ISO date string from API
     * @returns true if date is today in user's timezone
     */
    isToday: (utcDateString: string | null | undefined) =>
      isDateTodayInTimezone(utcDateString, timezone),

    /**
     * Format UTC date string for datetime-local input
     * @param utcDateString - ISO date string from API
     * @returns String formatted for input (YYYY-MM-DDTHH:MM)
     */
    formatForInput: (utcDateString: string | null | undefined) =>
      formatUtcForDateTimeLocalInput(utcDateString, timezone),

    /**
     * Parse datetime-local input value to UTC ISO string
     * @param inputValue - Value from datetime-local input
     * @returns UTC ISO string for API
     */
    parseFromInput: (inputValue: string) =>
      parseDateTimeLocalToUtc(inputValue, timezone),
  }), [timezone, isLoading]);
}
