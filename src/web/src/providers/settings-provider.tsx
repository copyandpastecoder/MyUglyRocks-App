'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuth } from './auth-provider';

interface SettingsContextType {
  theme: string;
  fontSize: string;
  density: string;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  theme: 'lapis-lazuli',
  fontSize: 'Medium',
  density: 'Comfortable',
  isLoading: true,
});

export function useSettings() {
  return useContext(SettingsContext);
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userApi.getSettings,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Apply settings to document
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply theme
    root.setAttribute('data-theme', settings.theme || 'lapis-lazuli');

    // Handle light/dark mode based on theme
    const isLightTheme = settings.theme === 'snowflake-obsidian';
    if (isLightTheme) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }

    // Apply font size
    root.setAttribute('data-font-size', settings.fontSize?.toLowerCase() || 'medium');

    // Apply density
    root.setAttribute('data-density', settings.density?.toLowerCase() || 'comfortable');

  }, [settings]);

  // Set defaults for non-logged-in users
  useEffect(() => {
    if (!user) {
      const root = document.documentElement;
      root.setAttribute('data-theme', 'lapis-lazuli');
      root.classList.add('dark');
      root.setAttribute('data-font-size', 'medium');
      root.setAttribute('data-density', 'comfortable');
    }
  }, [user]);

  return (
    <SettingsContext.Provider
      value={{
        theme: settings?.theme || 'lapis-lazuli',
        fontSize: settings?.fontSize || 'Medium',
        density: settings?.density || 'Comfortable',
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
