'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * AnimatedCounter - Smoothly animates number changes
 *
 * Usage:
 * ```tsx
 * <AnimatedCounter value={42} />
 * <AnimatedCounter value={99.5} decimals={1} suffix="%" />
 * ```
 */
export function AnimatedCounter({
  value,
  duration = 0.5,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) =>
    prefix + current.toFixed(decimals) + suffix
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  delay?: number;
}

/**
 * CountUp - Counts up from start to end on mount
 *
 * Usage:
 * ```tsx
 * <CountUp end={1000} separator="," />
 * <CountUp end={50} suffix="%" delay={0.2} />
 * ```
 */
export function CountUp({
  end,
  start = 0,
  duration = 2,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = '',
  delay = 0,
}: CountUpProps) {
  const [count, setCount] = useState(start);
  const countRef = useRef<number>(start);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const progress = Math.min(
          (timestamp - startTimeRef.current) / (duration * 1000),
          1
        );

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        countRef.current = start + (end - start) * eased;
        setCount(countRef.current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [end, start, duration, delay]);

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals);
    if (separator) {
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return parts.join('.');
    }
    return fixed;
  };

  return (
    <span className={className}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

interface AnimatedDigitProps {
  digit: string;
  className?: string;
}

function AnimatedDigit({ digit, className }: AnimatedDigitProps) {
  return (
    <motion.span
      key={digit}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={className}
    >
      {digit}
    </motion.span>
  );
}

interface FlipCounterProps {
  value: number;
  className?: string;
  digitClassName?: string;
}

/**
 * FlipCounter - Flip animation for each digit change
 *
 * Usage:
 * ```tsx
 * <FlipCounter value={123} />
 * ```
 */
export function FlipCounter({ value, className, digitClassName }: FlipCounterProps) {
  const digits = String(value).split('');

  return (
    <span className={`inline-flex ${className}`}>
      {digits.map((digit, index) => (
        <AnimatedDigit key={`${index}-${digit}`} digit={digit} className={digitClassName} />
      ))}
    </span>
  );
}
