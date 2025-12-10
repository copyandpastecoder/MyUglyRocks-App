'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Photo {
  url: string;
  thumbnailUrl?: string | null;
  mediumUrl?: string | null;
  largeUrl?: string | null;
  blurHash?: string | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
}

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function PhotoLightbox({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  onIndexChange,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setIsImageLoaded(false);
    }
  }, [isOpen, initialIndex]);

  // Notify parent of index changes
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : photos.length - 1;
      setIsImageLoaded(false);
      return newIndex;
    });
    setIsZoomed(false);
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = prev < photos.length - 1 ? prev + 1 : 0;
      setIsImageLoaded(false);
      return newIndex;
    });
    setIsZoomed(false);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          setIsZoomed(true);
          break;
        case '-':
          setIsZoomed(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  // Use the largest available URL for the lightbox
  const displayUrl = currentPhoto.largeUrl || currentPhoto.mediumUrl || currentPhoto.url;

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${currentIndex + 1}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(currentPhoto.url, '_blank');
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
        <div className="text-white text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className={cn(
        'relative w-full h-full flex items-center justify-center p-16',
        isZoomed && 'overflow-auto cursor-move'
      )}>
        {/* Blur placeholder */}
        {currentPhoto.blurHash && !isImageLoaded && (
          <img
            src={currentPhoto.blurHash}
            alt=""
            className="absolute inset-0 w-full h-full object-contain blur-sm scale-105"
            aria-hidden
          />
        )}

        {/* Main image */}
        <img
          src={displayUrl}
          alt={currentPhoto.caption || `Photo ${currentIndex + 1}`}
          className={cn(
            'max-h-full transition-all duration-200',
            isZoomed ? 'max-w-none cursor-zoom-out' : 'max-w-full cursor-zoom-in',
            !isImageLoaded && 'opacity-0'
          )}
          onClick={() => setIsZoomed(!isZoomed)}
          onLoad={() => setIsImageLoaded(true)}
          style={isZoomed ? { transform: 'scale(1.5)' } : undefined}
        />
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Previous (Left arrow)"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Next (Right arrow)"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Caption */}
      {currentPhoto.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-white text-center">{currentPhoto.caption}</p>
        </div>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[80%] overflow-x-auto">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsImageLoaded(false);
                setIsZoomed(false);
              }}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all',
                idx === currentIndex
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Use portal to render at document body level
  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}

// Hook for managing lightbox state
export function useLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const open = useCallback((index: number = 0) => {
    setInitialIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, initialIndex, open, close };
}
