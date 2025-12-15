'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  icon?: LucideIcon;
  actions?: FABAction[];
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

const positionClasses = {
  'bottom-right': 'bottom-20 right-4 md:bottom-6 md:right-6',
  'bottom-left': 'bottom-20 left-4 md:bottom-6 md:left-6',
  'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2 md:bottom-6',
};

/**
 * FloatingActionButton - Material Design style FAB
 *
 * Usage:
 * ```tsx
 * // Simple FAB
 * <FloatingActionButton onClick={() => router.push('/new')} />
 *
 * // FAB with expandable actions
 * <FloatingActionButton
 *   actions={[
 *     { icon: Camera, label: 'Add Photo', onClick: handleAddPhoto },
 *     { icon: FileText, label: 'Add Note', onClick: handleAddNote },
 *     { icon: RotateCcw, label: 'New Cycle', onClick: handleNewCycle },
 *   ]}
 * />
 * ```
 */
export function FloatingActionButton({
  icon: Icon = Plus,
  actions,
  onClick,
  position = 'bottom-right',
  className,
  tooltip,
  size = 'md',
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActions = actions && actions.length > 0;

  const handleClick = () => {
    if (hasActions) {
      setIsExpanded(!isExpanded);
    } else {
      onClick?.();
    }
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Action buttons */}
      <AnimatePresence>
        {isExpanded && hasActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-3 flex flex-col-reverse gap-3"
          >
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    setIsExpanded(false);
                  }}
                  className="group flex items-center gap-3"
                >
                  {/* Label */}
                  <span className="px-3 py-1.5 text-sm font-medium bg-card text-foreground rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.label}
                  </span>

                  {/* Icon button */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full shadow-lg',
                      'bg-card text-foreground hover:bg-muted transition-colors',
                      action.color
                    )}
                  >
                    <ActionIcon className="w-5 h-5" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={cn(
          'flex items-center justify-center rounded-full shadow-lg',
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          sizeClasses[size]
        )}
        title={tooltip}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? (
            <X className={iconSizes[size]} />
          ) : (
            <Icon className={iconSizes[size]} />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}

// Extended FAB with label
interface ExtendedFABProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

export function ExtendedFAB({
  icon: Icon,
  label,
  onClick,
  position = 'bottom-right',
  className,
}: ExtendedFABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'fixed z-50 flex items-center gap-2 px-5 py-3.5 rounded-full shadow-lg',
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        positionClasses[position],
        className
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}

// Mini FAB for secondary actions
interface MiniFABProps {
  icon: LucideIcon;
  onClick: () => void;
  tooltip?: string;
  className?: string;
}

export function MiniFAB({ icon: Icon, onClick, tooltip, className }: MiniFABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={tooltip}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full shadow-md',
        'bg-card text-foreground border border-border',
        'hover:bg-muted transition-colors',
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
}
