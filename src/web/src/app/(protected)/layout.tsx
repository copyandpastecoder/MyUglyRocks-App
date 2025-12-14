'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { AppShell } from '@/components/layout/app-shell';
import { CommandPalette } from '@/components/ui/command-palette';
import { MobileBottomNav, MobileNavSpacer } from '@/components/ui/mobile-nav';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <CommandPalette />
      <AppShell>
        {children}
        <MobileNavSpacer />
      </AppShell>
      <MobileBottomNav />
    </>
  );
}
