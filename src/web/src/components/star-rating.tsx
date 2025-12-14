'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  label?: string;
  description?: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  label,
  description,
  value,
  onChange,
  disabled = false,
  size = 'md',
}: StarRatingProps) {
  const currentValue = value ?? 0;

  const handleClick = (rating: number) => {
    // Toggle off if clicking the same rating
    if (currentValue === rating) {
      onChange(null);
    } else {
      onChange(rating);
    }
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'h-7 px-2',
    md: 'h-8 px-2.5',
    lg: 'h-9 px-3',
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            type="button"
            variant="outline"
            size="sm"
            className={cn(buttonSizeClasses[size])}
            onClick={() => handleClick(rating)}
            disabled={disabled}
          >
            <Star
              className={cn(
                sizeClasses[size],
                currentValue >= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </Button>
        ))}
      </div>
    </div>
  );
}
