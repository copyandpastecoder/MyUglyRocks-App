'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface RouteTransitionProps {
  children: ReactNode;
  className?: string;
  mode?: 'wait' | 'sync' | 'popLayout';
}

const variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const, // Custom easing for smoother feel
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

/**
 * RouteTransition - Wrap page content for smooth route transitions
 *
 * Usage in layout:
 * ```tsx
 * <RouteTransition>
 *   {children}
 * </RouteTransition>
 * ```
 */
export function RouteTransition({ children, className, mode = 'wait' }: RouteTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Slide variants for different directions
const slideVariants = {
  left: {
    initial: { opacity: 0, x: -30 },
    enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
  },
  right: {
    initial: { opacity: 0, x: 30 },
    enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
  },
  up: {
    initial: { opacity: 0, y: 30 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.2 } },
  },
  down: {
    initial: { opacity: 0, y: -30 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: 30, transition: { duration: 0.2 } },
  },
};

interface SlideTransitionProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

export function SlideTransition({ children, direction = 'up', className }: SlideTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={slideVariants[direction]}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Scale transition for modal-like content
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

interface ScaleTransitionProps {
  children: ReactNode;
  className?: string;
}

export function ScaleTransition({ children, className }: ScaleTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={scaleVariants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
