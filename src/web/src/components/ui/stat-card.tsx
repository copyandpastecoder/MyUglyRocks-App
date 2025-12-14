'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type GradientVariant = 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'default';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  gradient?: GradientVariant;
  className?: string;
  trend?: {
    value: number;
    label?: string;
  };
}

const gradientClasses: Record<GradientVariant, string> = {
  blue: 'bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border-blue-500/20',
  green: 'bg-gradient-to-br from-green-500/10 via-transparent to-transparent border-green-500/20',
  purple: 'bg-gradient-to-br from-purple-500/10 via-transparent to-transparent border-purple-500/20',
  amber: 'bg-gradient-to-br from-amber-500/10 via-transparent to-transparent border-amber-500/20',
  rose: 'bg-gradient-to-br from-rose-500/10 via-transparent to-transparent border-rose-500/20',
  default: 'bg-card',
};

const iconContainerClasses: Record<GradientVariant, string> = {
  blue: 'bg-blue-500/10 text-blue-500',
  green: 'bg-green-500/10 text-green-500',
  purple: 'bg-purple-500/10 text-purple-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500',
  default: 'bg-muted text-muted-foreground',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'default',
  className,
  trend,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-6 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        gradientClasses[gradient],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.value >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
              {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'rounded-lg p-2.5',
            iconContainerClasses[gradient]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
