'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  RotateCcw,
  Cylinder,
  BookOpen,
  Settings,
  Plus,
  Search,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface CommandItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  action: () => void;
  group: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  customCommands?: CommandItem[];
}

/**
 * CommandPalette - CMD+K quick actions menu
 *
 * Usage:
 * ```tsx
 * // Add to your layout
 * <CommandPalette />
 *
 * // With custom commands
 * <CommandPalette
 *   customCommands={[
 *     {
 *       id: 'custom-action',
 *       label: 'Custom Action',
 *       icon: Star,
 *       action: () => console.log('Custom!'),
 *       group: 'Actions',
 *     }
 *   ]}
 * />
 * ```
 */
export function CommandPalette({ customCommands = [] }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme: _theme } = useTheme();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const defaultCommands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Go to Dashboard',
      icon: Home,
      shortcut: 'G H',
      action: () => router.push('/dashboard'),
      group: 'Navigation',
      keywords: ['home', 'main'],
    },
    {
      id: 'nav-cycles',
      label: 'Go to Cycles',
      icon: RotateCcw,
      shortcut: 'G C',
      action: () => router.push('/cycles'),
      group: 'Navigation',
      keywords: ['tumbling', 'polish'],
    },
    {
      id: 'nav-tumblers',
      label: 'Go to Tumblers',
      icon: Cylinder,
      shortcut: 'G T',
      action: () => router.push('/tumblers'),
      group: 'Navigation',
      keywords: ['machines', 'equipment'],
    },
    {
      id: 'nav-learn',
      label: 'Go to Learn',
      icon: BookOpen,
      shortcut: 'G L',
      action: () => router.push('/learn'),
      group: 'Navigation',
      keywords: ['guide', 'tutorial', 'help'],
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      icon: Settings,
      shortcut: 'G S',
      action: () => router.push('/settings'),
      group: 'Navigation',
      keywords: ['preferences', 'account'],
    },

    // Actions
    {
      id: 'action-new-cycle',
      label: 'Create New Cycle',
      icon: Plus,
      shortcut: 'N C',
      action: () => router.push('/cycles/new'),
      group: 'Actions',
      keywords: ['add', 'start'],
    },
    {
      id: 'action-new-tumbler',
      label: 'Add New Tumbler',
      icon: Plus,
      action: () => router.push('/tumblers/new'),
      group: 'Actions',
      keywords: ['add', 'register'],
    },

    // Theme
    {
      id: 'theme-light',
      label: 'Switch to Light Mode',
      icon: Sun,
      action: () => setTheme('light'),
      group: 'Theme',
      keywords: ['bright', 'day'],
    },
    {
      id: 'theme-dark',
      label: 'Switch to Dark Mode',
      icon: Moon,
      action: () => setTheme('dark'),
      group: 'Theme',
      keywords: ['night', 'dim'],
    },
  ];

  const allCommands = [...defaultCommands, ...customCommands];

  // Group commands
  const groups = allCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <>
      {/* Trigger button (optional, keyboard shortcut is primary) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-md border border-border transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {Object.entries(groups).map(([group, commands], index) => (
            <div key={group}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {commands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <CommandItem
                      key={cmd.id}
                      onSelect={() => runCommand(cmd.action)}
                      keywords={cmd.keywords}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span>{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Hook for programmatic control
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
