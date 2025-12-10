'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  blurHash?: string | null;
  className?: string;
  wrapperClassName?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  blurHash,
  className,
  wrapperClassName,
  placeholderClassName,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading before it's in view
        threshold: 0,
      }
    );

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={wrapperRef} className={cn('relative overflow-hidden', wrapperClassName)}>
      {/* Blur placeholder */}
      {blurHash && !isLoaded && (
        <img
          src={blurHash}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover blur-sm scale-105 transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100',
            placeholderClassName
          )}
          aria-hidden
        />
      )}

      {/* Solid background fallback if no blur hash */}
      {!blurHash && !isLoaded && (
        <div
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            isLoaded && 'hidden'
          )}
        />
      )}

      {/* Actual image - only load when in view */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
}
