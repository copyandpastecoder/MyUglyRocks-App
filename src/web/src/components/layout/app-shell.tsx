'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  const handleToggle = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  return (
    <div className="flex h-screen">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
