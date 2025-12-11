'use client';

import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'processing';

interface StatusDotProps {
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
  label?: string;
}

const variantClasses: Record<StatusVariant, string> = {
  default: 'bg-muted-foreground',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  processing: 'bg-primary',
};

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function StatusDot({
  variant = 'default',
  size = 'md',
  pulse = false,
  className,
  label,
}: StatusDotProps) {
  const shouldPulse = pulse || variant === 'processing';

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex">
        {/* Pulse ring */}
        {shouldPulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              variantClasses[variant]
            )}
          />
        )}
        {/* Dot */}
        <span
          className={cn(
            'relative inline-flex rounded-full',
            sizeClasses[size],
            variantClasses[variant]
          )}
        />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}

// Inline status with dot and text
interface StatusIndicatorProps {
  status: 'active' | 'completed' | 'pending' | 'failed' | 'processing';
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<StatusIndicatorProps['status'], { variant: StatusVariant; label: string; pulse: boolean }> = {
  active: { variant: 'success', label: 'Active', pulse: true },
  completed: { variant: 'success', label: 'Completed', pulse: false },
  pending: { variant: 'warning', label: 'Pending', pulse: false },
  failed: { variant: 'error', label: 'Failed', pulse: false },
  processing: { variant: 'processing', label: 'Processing', pulse: true },
};

export function StatusIndicator({
  status,
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <StatusDot
      variant={config.variant}
      pulse={config.pulse}
      label={showLabel ? config.label : undefined}
      className={className}
    />
  );
}
