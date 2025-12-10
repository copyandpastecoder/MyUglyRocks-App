'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { authApi, setAccessToken, getApiUrl } from '@/lib/api';
import { detectBrowserCapabilities, clearCapabilitiesCache } from '@/lib/browser-capabilities';
import { startSessionHeartbeat, stopSessionHeartbeat, endSession } from '@/lib/session-heartbeat';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAuth = useCallback(async () => {
    try {
      const result = await authApi.refresh();
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      // Wait for API config to be loaded before making any API calls
      await getApiUrl();
      await refreshAuth();
      setIsLoading(false);
    };

    initAuth();
  }, [refreshAuth]);

  const login = async (data: LoginRequest) => {
    try {
      // Detect browser capabilities before login
      const capabilities = await detectBrowserCapabilities();

      // Merge capabilities with login data
      const loginData: LoginRequest = {
        ...data,
        screenWidth: capabilities.screenWidth,
        screenHeight: capabilities.screenHeight,
        supportsWebP: capabilities.supportsWebP,
        supportsAvif: capabilities.supportsAvif,
        timezone: capabilities.timezone,
        language: capabilities.language,
        referrerDomain: capabilities.referrerDomain,
      };

      const result = await authApi.login(loginData);
      if (result.success && result.user) {
        setUser(result.user);

        // Start session heartbeat if we have a session ID
        if (result.sessionId) {
          startSessionHeartbeat(result.sessionId);
        }

        return { success: true };
      }
      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const result = await authApi.register(data);
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // End the session tracking
      await endSession();
      await authApi.logout();
    } finally {
      setUser(null);
      stopSessionHeartbeat();
      clearCapabilitiesCache();
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
