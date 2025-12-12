'use client';

import { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';
import { cn } from '@/lib/utils';

interface EnhancedImageProps {
  src: string;
  alt: string;
  blurHash?: string | null;
  width?: number;
  height?: number;
  className?: string;
  wrapperClassName?: string;
  hoverZoom?: boolean;
  onClick?: () => void;
}

export function EnhancedImage({
  src,
  alt,
  blurHash,
  width,
  height,
  className,
  wrapperClassName,
  hoverZoom = false,
  onClick,
}: EnhancedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        hoverZoom && 'group cursor-pointer',
        wrapperClassName
      )}
      onClick={onClick}
    >
      {/* BlurHash placeholder */}
      {blurHash && !isLoaded && !hasError && (
        <div className="absolute inset-0">
          <Blurhash
            hash={blurHash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Fallback placeholder when no blurHash */}
      {!blurHash && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-all duration-300',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100',
          hoverZoom && 'group-hover:scale-105',
          className
        )}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
}
