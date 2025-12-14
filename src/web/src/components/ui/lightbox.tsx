'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from './button';
import { EnhancedImage } from './enhanced-image';
import { cn } from '@/lib/utils';

interface LightboxImage {
  src: string;
  alt?: string;
  blurHash?: string | null;
  caption?: string | null;
}

interface LightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}: LightboxProps) {
  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasMultiple && onPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasMultiple && onNext) onNext();
          break;
      }
    },
    [isOpen, onClose, onNext, onPrevious, hasMultiple]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = currentImage.alt || 'image';
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

          {/* Content */}
          <div
            className="relative z-10 flex flex-col items-center max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <EnhancedImage
                src={currentImage.src}
                alt={currentImage.alt || 'Image'}
                blurHash={currentImage.blurHash}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
                wrapperClassName="flex items-center justify-center"
              />
            </motion.div>

            {/* Caption */}
            {currentImage.caption && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-white/80 text-center max-w-lg"
              >
                {currentImage.caption}
              </motion.p>
            )}

            {/* Counter */}
            {hasMultiple && (
              <p className="mt-2 text-white/60 text-sm">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation arrows */}
          {hasMultiple && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious?.();
                }}
                className={cn(
                  'absolute left-4 top-1/2 -translate-y-1/2 z-20',
                  'text-white/80 hover:text-white hover:bg-white/10',
                  'h-12 w-12'
                )}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext?.();
                }}
                className={cn(
                  'absolute right-4 top-1/2 -translate-y-1/2 z-20',
                  'text-white/80 hover:text-white hover:bg-white/10',
                  'h-12 w-12'
                )}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing lightbox state
import { useState } from 'react';

export function useLightbox(images: LightboxImage[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = (index: number = 0) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return {
    isOpen,
    currentIndex,
    open,
    close,
    next,
    previous,
  };
}
