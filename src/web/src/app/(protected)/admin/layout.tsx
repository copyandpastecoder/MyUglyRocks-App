'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Flag, Users, ShieldAlert, Gem, FlaskConical, BarChart3, Mail, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Moderation',
    href: '/admin/moderation',
    icon: Flag,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Invitations',
    href: '/admin/invitations',
    icon: Mail,
    adminOnly: true,
  },
  {
    title: 'Specimens',
    href: '/admin/specimens',
    icon: Gem,
    adminOnly: true,
  },
  {
    title: 'Materials',
    href: '/admin/materials',
    icon: FlaskConical,
    adminOnly: true,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    adminOnly: true,
  },
  {
    title: 'Backups',
    href: '/admin/backups',
    icon: Database,
    adminOnly: true,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Check if user has admin or moderator role
  const isAdmin = user?.role === 'Admin';
  const isModerator = user?.role === 'Moderator';
  const hasAccess = isAdmin || isModerator;

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin area.
            This area is restricted to administrators and moderators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, moderation, and site content
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar Navigation */}
        <nav className="flex flex-col gap-1 md:w-48 lg:w-56">
          {adminNavItems.map((item) => {
            // Hide admin-only items from moderators
            if (item.adminOnly && !isAdmin) return null;

            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
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
