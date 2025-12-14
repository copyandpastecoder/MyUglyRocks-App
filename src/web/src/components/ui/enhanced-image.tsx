'use client';

import { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';
import { cn } from '@/lib/utils';

// Valid blurhash is typically 20-30 chars of base83 characters
function isValidBlurhash(hash: string): boolean {
  // Blurhash strings are short (typically 20-30 chars) and don't start with "data:"
  if (hash.startsWith('data:')) return false;
  if (hash.length < 6 || hash.length > 100) return false;
  return true;
}

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

  // Determine if blurHash is a valid blurhash or a data URI
  const isDataUri = blurHash?.startsWith('data:') ?? false;
  const validBlurhash = blurHash && isValidBlurhash(blurHash) ? blurHash : null;

  useEffect(() => {
    // Reset state when src changes
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state when prop changes
    setIsLoaded(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      {/* BlurHash placeholder (proper blurhash string) */}
      {validBlurhash && !isLoaded && !hasError && (
        <div className="absolute inset-0">
          <Blurhash
            hash={validBlurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Data URI placeholder (base64 image) */}
      {isDataUri && blurHash && !isLoaded && !hasError && (
        <img
          src={blurHash}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
          aria-hidden
        />
      )}

      {/* Fallback placeholder when no valid blurHash or data URI */}
      {!validBlurhash && !isDataUri && !isLoaded && !hasError && (
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
