'use client';

import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';

interface AmountInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'step'> {
  /** The step value for increment/decrement (default: 1) */
  step?: number;
}

/**
 * A number input that increments/decrements by whole numbers (default step=1)
 * but allows decimal values to be typed manually.
 * Uses step="any" internally to allow decimal input while handling arrows to use integer step.
 */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ step = 1, onChange, onKeyDown, className, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const currentValue = parseFloat(input.value) || 0;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newValue = Math.round((currentValue + step) * 10) / 10;
        const min = props.min !== undefined ? parseFloat(String(props.min)) : -Infinity;
        const max = props.max !== undefined ? parseFloat(String(props.max)) : Infinity;
        const clampedValue = Math.min(Math.max(newValue, min), max);

        // Create a synthetic event to trigger onChange
        const nativeEvent = new Event('input', { bubbles: true });
        Object.defineProperty(nativeEvent, 'target', { value: { ...input, value: String(clampedValue) } });
        input.value = String(clampedValue);
        onChange?.(nativeEvent as unknown as React.ChangeEvent<HTMLInputElement>);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newValue = Math.round((currentValue - step) * 10) / 10;
        const min = props.min !== undefined ? parseFloat(String(props.min)) : -Infinity;
        const max = props.max !== undefined ? parseFloat(String(props.max)) : Infinity;
        const clampedValue = Math.min(Math.max(newValue, min), max);

        const nativeEvent = new Event('input', { bubbles: true });
        Object.defineProperty(nativeEvent, 'target', { value: { ...input, value: String(clampedValue) } });
        input.value = String(clampedValue);
        onChange?.(nativeEvent as unknown as React.ChangeEvent<HTMLInputElement>);
      }

      onKeyDown?.(e);
    };

    return (
      <Input
        ref={ref}
        type="number"
        step="any"
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';
