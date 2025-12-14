'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Image,
  Inbox,
  Search,
  FileQuestion,
  Plus,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  children?: ReactNode;
}

/**
 * EmptyState - Displays a friendly message when there's no content
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={FolderOpen}
 *   title="No cycles yet"
 *   description="Create your first tumbling cycle to get started"
 *   action={{
 *     label: "New Cycle",
 *     onClick: () => router.push('/cycles/new'),
 *     icon: Plus
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  const ActionIcon = action?.icon || Plus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="relative mb-6"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-150" />

        {/* Icon container */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 border border-border">
          <Icon className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm max-w-sm mb-6"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={action.onClick} className="gap-2">
            <ActionIcon className="w-4 h-4" />
            {action.label}
          </Button>
        </motion.div>
      )}

      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

// Pre-configured empty states for common scenarios
export function NoCyclesEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No cycles yet"
      description="Start your rock tumbling journey by creating your first cycle"
      action={onAction ? { label: 'Create Cycle', onClick: onAction, icon: Plus } : undefined}
    />
  );
}

export function NoTumblersEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Inbox}
      title="No tumblers registered"
      description="Add your rock tumbler to start tracking your cycles"
      action={onAction ? { label: 'Add Tumbler', onClick: onAction, icon: Plus } : undefined}
    />
  );
}

export function NoPhotosEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Image}
      title="No photos yet"
      description="Capture the progress of your rocks by adding photos"
      action={onAction ? { label: 'Add Photo', onClick: onAction, icon: Plus } : undefined}
    />
  );
}

export function NoSearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={query ? `We couldn't find anything matching "${query}"` : "Try adjusting your search or filters"}
    />
  );
}

export function NotFoundEmpty() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      description="The page you&apos;re looking for doesn&apos;t exist or has been moved"
    />
  );
}
