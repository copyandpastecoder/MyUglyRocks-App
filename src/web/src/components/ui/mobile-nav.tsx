'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  RotateCcw,
  Cylinder,
  Package,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const defaultNavItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Cycles', href: '/cycles', icon: RotateCcw },
  { label: 'Tumblers', href: '/tumblers', icon: Cylinder },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface MobileBottomNavProps {
  items?: NavItem[];
  className?: string;
  showLabels?: boolean;
  centerAction?: {
    icon: LucideIcon;
    onClick: () => void;
    label?: string;
  };
}

/**
 * MobileBottomNav - Bottom navigation bar for mobile devices
 *
 * Usage:
 * ```tsx
 * // In your layout (only shows on mobile)
 * <MobileBottomNav />
 *
 * // With center action button
 * <MobileBottomNav
 *   centerAction={{
 *     icon: Plus,
 *     onClick: () => router.push('/cycles/new'),
 *     label: 'New',
 *   }}
 * />
 * ```
 */
export function MobileBottomNav({
  items = defaultNavItems,
  className,
  showLabels = true,
  centerAction,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  // Split items for center action if provided
  const leftItems = centerAction ? items.slice(0, Math.floor(items.length / 2)) : items;
  const rightItems = centerAction ? items.slice(Math.floor(items.length / 2)) : [];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-card/95 backdrop-blur-lg border-t border-border',
        'pb-safe', // Safe area padding for iOS
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Left items */}
        {leftItems.map((item) => (
          <NavItemButton
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            showLabel={showLabels}
          />
        ))}

        {/* Center action button */}
        {centerAction && (
          <button
            onClick={centerAction.onClick}
            className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          >
            <centerAction.icon className="w-6 h-6" />
          </button>
        )}

        {/* Right items */}
        {rightItems.map((item) => (
          <NavItemButton
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            showLabel={showLabels}
          />
        ))}
      </div>
    </nav>
  );
}

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  showLabel: boolean;
}

function NavItemButton({ item, isActive, showLabel }: NavItemButtonProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex flex-col items-center justify-center flex-1 h-full',
        'transition-colors duration-200',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </div>

      {showLabel && (
        <span className="mt-1 text-[10px] font-medium">{item.label}</span>
      )}

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="mobile-nav-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}

// Safe area spacing component for bottom content
export function MobileNavSpacer() {
  return <div className="h-16 md:h-0" />;
}
