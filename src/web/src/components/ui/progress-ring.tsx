'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  children?: React.ReactNode;
  showValue?: boolean;
  animate?: boolean;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  trackClassName,
  progressClassName,
  children,
  showValue = false,
  animate = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-muted', trackClassName)}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'stroke-primary',
            animate && 'transition-[stroke-dashoffset] duration-500 ease-out',
            progressClassName
          )}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <span className="text-2xl font-bold">{Math.round(value)}%</span>
        ))}
      </div>
    </div>
  );
}

// Smaller variant for inline use
interface MiniProgressRingProps {
  value: number;
  size?: number;
  className?: string;
}

export function MiniProgressRing({
  value,
  size = 24,
  className,
}: MiniProgressRingProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={cn('transform -rotate-90', className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}
