'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PAGE_CONTAINER } from '@/lib/layout';
import { User, Settings, Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const settingsNavItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Manage your public profile',
  },
  {
    title: 'Preferences',
    href: '/settings/preferences',
    icon: Settings,
    description: 'Customize your experience',
  },
  {
    title: 'Account',
    href: '/settings/account',
    icon: Shield,
    description: 'Security and account settings',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get current page title for mobile header
  const currentPage = settingsNavItems.find((item) => item.href === pathname);

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar Navigation */}
        <nav
          className={cn(
            'flex flex-col gap-1 md:w-48 lg:w-56',
            // Mobile: collapsible
            'md:block',
            sidebarOpen ? 'block' : 'hidden'
          )}
        >
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
