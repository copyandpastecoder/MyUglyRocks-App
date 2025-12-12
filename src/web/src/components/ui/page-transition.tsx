'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.2,
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered children animation for lists
const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      ease: 'easeOut' as const,
      duration: 0.2,
    },
  },
};

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Hover scale animation for cards
interface HoverScaleProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function HoverScale({ children, className, scale = 1.02 }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
