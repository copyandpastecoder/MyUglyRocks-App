'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, Shield, Menu, Home, RotateCcw, Cylinder, Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Cycles', href: '/cycles', icon: RotateCcw },
  { label: 'Tumblers', href: '/tumblers', icon: Cylinder },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAdminOrMod = user?.role === 'Admin' || user?.role === 'Moderator';

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Mobile hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1"></div>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? user?.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.displayName && (
                      <p className="font-medium">{user.displayName}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {isAdminOrMod && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex cursor-pointer items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex cursor-pointer items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            {isAdminOrMod && (
              <Link
                href="/admin"
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <button
              onClick={() => {
                setMobileNavOpen(false);
                logout();
              }}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
