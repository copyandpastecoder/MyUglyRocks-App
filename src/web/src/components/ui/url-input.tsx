'use client';

import * as React from 'react';
import { ExternalLink, Link2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface UrlInputProps extends Omit<React.ComponentProps<'input'>, 'type' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  showPreviewButton?: boolean;
  validateOnBlur?: boolean;
}

function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  if (trimmed && !trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function UrlInput({
  className,
  value = '',
  onChange,
  showPreviewButton = true,
  validateOnBlur = true,
  onBlur,
  ...props
}: UrlInputProps) {
  const [isValid, setIsValid] = React.useState(true);
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
    setIsValid(isValidUrl(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsValid(true); // Don't show error while typing
    onChange?.(newValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (validateOnBlur && localValue) {
      const normalized = normalizeUrl(localValue);
      const valid = isValidUrl(normalized);
      setIsValid(valid);
      if (valid && normalized !== localValue) {
        setLocalValue(normalized);
        onChange?.(normalized);
      }
    }
    onBlur?.(e);
  };

  const handleOpenUrl = () => {
    if (localValue && isValid) {
      const url = normalizeUrl(localValue);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Link2 className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="url"
          className={cn('pl-9', !isValid && 'border-destructive', className)}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="https://example.com"
          {...props}
        />
        {!isValid && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="text-destructive absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Please enter a valid URL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {showPreviewButton && localValue && isValid && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleOpenUrl}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Open URL</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in new tab</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export { UrlInput, isValidUrl, normalizeUrl };
