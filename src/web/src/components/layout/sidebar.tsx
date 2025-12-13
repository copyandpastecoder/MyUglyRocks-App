'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Cylinder,
  RotateCcw,
  ImageIcon,
  Settings,
  HelpCircle,
  Gem,
  Sparkles,
  MessageCircleQuestion,
  Menu,
  ChevronLeft,
  Package,
} from 'lucide-react';
import { getHelpTopicFromPath } from '@/data/help-content';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tumbling Cycles', href: '/cycles', icon: RotateCcw },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Photo Gallery', href: '/gallery', icon: ImageIcon },
  { name: 'My Tumblers', href: '/tumblers', icon: Cylinder },
];

const learnNavigation = [
  { name: 'Rock Database', href: '/learn/specimens', icon: Gem },
  { name: 'Grits & Polishes', href: '/learn/materials', icon: Sparkles },
  { name: 'FAQ', href: '/learn/faq', icon: MessageCircleQuestion },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Get context-aware help link based on current page
  const helpHref = useMemo(() => {
    const topic = getHelpTopicFromPath(pathname);
    return `/learn/faq/${topic}`;
  }, [pathname]);

  const NavLink = ({ item, isActive }: { item: typeof navigation[0]; isActive: boolean }) => {
    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          'group flex gap-3 rounded-md px-3 py-2 text-sm font-medium leading-6 transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex h-full flex-col bg-sidebar transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn(
          'flex h-16 shrink-0 items-center',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-sidebar-foreground">MyUglyRocks</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-9 w-9 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
        <nav className={cn('flex flex-1 flex-col py-4', collapsed ? 'px-2' : 'px-4')}>
          <ul role="list" className="flex flex-1 flex-col gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <NavLink item={item} isActive={isActive} />
                </li>
              );
            })}
            {!collapsed && (
              <li className="mt-4">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Learn
                </p>
              </li>
            )}
            {collapsed && <li className="mt-4 border-t border-sidebar-accent" />}
            {learnNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <NavLink item={item} isActive={isActive} />
                </li>
              );
            })}
          </ul>
          <ul role="list" className="mt-auto flex flex-col gap-1">
            {/* Settings link */}
            <li>
              <NavLink
                item={{ name: 'Settings', href: '/settings', icon: Settings }}
                isActive={pathname === '/settings' || pathname.startsWith('/settings/')}
              />
            </li>
            {/* Context-aware Help link */}
            <li>
              <NavLink
                item={{ name: 'Help', href: helpHref, icon: HelpCircle }}
                isActive={pathname.startsWith('/learn/faq')}
              />
            </li>
          </ul>
        </nav>
      </div>
    </TooltipProvider>
  );
}
