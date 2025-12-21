'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Scale } from 'lucide-react';
import { useSettings } from '@/hooks/use-user';
import { cn } from '@/lib/utils';

interface WeightInputProps {
  label: string;
  /** Helper text shown below the label (e.g., "Before: 0.86 kg") */
  helperText?: string;
  /** Value in grams (stored internally) */
  valueGrams: number | null;
  /** Called with new value in grams and display unit */
  onValueChange: (grams: number | null, displayUnit?: string) => void;
  placeholder?: string;
  /** Barrel capacity in lbs for validation (optional) */
  barrelCapacityLbs?: number;
  /** Called when validation state changes */
  onValidationChange?: (isValid: boolean, message?: string) => void;
  /** Initial display unit (optional, defaults to user's setting) */
  initialDisplayUnit?: string;
}

// Conversion constants
const LB_TO_GRAMS = 453.592;
const OZ_TO_GRAMS = 28.3495;
const KG_TO_GRAMS = 1000;

// Session storage key for remembering expanded state
const EXPANDED_STATE_KEY = 'weightInput_expanded';
const METRIC_STATE_KEY = 'weightInput_metric';

// Helper to convert grams to display values
function gramsToDisplay(
  grams: number | null,
  isMetric: boolean,
  showLargeUnit: boolean
): { large: string; small: string } {
  if (grams === null || grams === undefined) {
    return { large: '', small: '' };
  }

  if (isMetric) {
    if (showLargeUnit) {
      // Metric expanded: kg + g
      const kg = Math.floor(grams / KG_TO_GRAMS);
      const g = Math.round(grams % KG_TO_GRAMS);
      return { large: kg > 0 ? String(kg) : '', small: String(g) };
    } else {
      // Metric collapsed: just g
      return { large: '', small: String(Math.round(grams)) };
    }
  } else {
    if (showLargeUnit) {
      // Imperial expanded: lbs + oz
      const totalOz = grams / OZ_TO_GRAMS;
      const lbs = Math.floor(totalOz / 16);
      const oz = Math.round((totalOz % 16) * 10) / 10;
      return { large: lbs > 0 ? String(lbs) : '', small: String(oz) };
    } else {
      // Imperial collapsed: just oz
      const totalOz = Math.round((grams / OZ_TO_GRAMS) * 10) / 10;
      return { large: '', small: String(totalOz) };
    }
  }
}

/**
 * Weight input with collapsible large unit display.
 * Default: shows only oz (Imperial) or g (Metric)
 * Expanded: shows lbs + oz (Imperial) or kg + g (Metric)
 * Stores value internally as grams.
 *
 * Uses a fully controlled pattern where display values are derived from props.
 */
export function WeightInput({
  label,
  helperText,
  valueGrams,
  onValueChange,
  placeholder,
  barrelCapacityLbs,
  onValidationChange,
  initialDisplayUnit,
}: WeightInputProps) {
  const { data: settings } = useSettings();

  // Track whether user has made an explicit choice (to avoid overriding with settings)
  const [hasUserChoice, setHasUserChoice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(METRIC_STATE_KEY) !== null;
  });

  // Local state for user's explicit unit choice - only used when hasUserChoice is true
  const [userSelectedMetric, setUserSelectedMetric] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedMetric = sessionStorage.getItem(METRIC_STATE_KEY);
    if (savedMetric !== null) {
      return savedMetric === 'true';
    }
    if (initialDisplayUnit) {
      return initialDisplayUnit === 'g' || initialDisplayUnit === 'kg';
    }
    return false;
  });

  // Derive effective isMetric value based on user choice or settings
  const isMetric = useMemo(() => {
    // User's explicit choice takes priority
    if (hasUserChoice) {
      return userSelectedMetric;
    }
    // Fall back to user settings
    if (settings?.measurementSystem) {
      return settings.measurementSystem === 'Metric';
    }
    // Default based on initialDisplayUnit or false
    return userSelectedMetric;
  }, [hasUserChoice, userSelectedMetric, settings?.measurementSystem]);

  // Setter that marks user as having made an explicit choice
  const setIsMetric = useCallback((value: boolean) => {
    setHasUserChoice(true);
    setUserSelectedMetric(value);
  }, []);

  // State for showing the large unit (lbs/kg) - remembers last choice
  const [showLargeUnit, setShowLargeUnit] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedExpanded = sessionStorage.getItem(EXPANDED_STATE_KEY);
    return savedExpanded === 'true';
  });

  // Derive display values directly from props - no local state needed
  const derivedDisplay = useMemo(
    () => gramsToDisplay(valueGrams, isMetric, showLargeUnit),
    [valueGrams, isMetric, showLargeUnit]
  );

  // Calculate validation state
  const validation = useMemo(() => {
    if (!barrelCapacityLbs || !valueGrams) {
      return { status: 'ok' as const, message: '' };
    }

    const capacityGrams = barrelCapacityLbs * LB_TO_GRAMS;
    const percentage = (valueGrams / capacityGrams) * 100;

    if (percentage > 150) {
      return {
        status: 'error' as const,
        message: `Weight exceeds 150% of barrel capacity (${barrelCapacityLbs} lbs). Please check your entry.`,
      };
    } else if (percentage > 100) {
      return {
        status: 'warning' as const,
        message: `Weight is ${Math.round(percentage)}% of barrel capacity (${barrelCapacityLbs} lbs).`,
      };
    }

    return { status: 'ok' as const, message: '' };
  }, [valueGrams, barrelCapacityLbs]);

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(validation.status !== 'error', validation.message);
  }, [validation, onValidationChange]);

  const calculateGrams = useCallback((large: string, small: string, metric: boolean, expanded: boolean): number | null => {
    const largeNum = parseFloat(large) || 0;
    const smallNum = parseFloat(small) || 0;

    if (largeNum === 0 && smallNum === 0 && !large && !small) {
      return null;
    }

    if (metric) {
      if (expanded) {
        // kg + g
        return Math.round(largeNum * KG_TO_GRAMS + smallNum);
      } else {
        // just g
        return Math.round(smallNum);
      }
    } else {
      if (expanded) {
        // lbs + oz
        return Math.round(largeNum * LB_TO_GRAMS + smallNum * OZ_TO_GRAMS);
      } else {
        // just oz
        return Math.round(smallNum * OZ_TO_GRAMS);
      }
    }
  }, []);

  const getDisplayUnit = (metric: boolean): string => {
    return metric ? 'g' : 'oz';
  };

  const handleLargeUnitChange = useCallback((value: string) => {
    const newGrams = calculateGrams(value, derivedDisplay.small, isMetric, showLargeUnit);
    onValueChange(newGrams, getDisplayUnit(isMetric));
  }, [derivedDisplay.small, isMetric, showLargeUnit, onValueChange, calculateGrams]);

  const handleSmallUnitChange = useCallback((value: string) => {
    const newGrams = calculateGrams(derivedDisplay.large, value, isMetric, showLargeUnit);
    onValueChange(newGrams, getDisplayUnit(isMetric));
  }, [derivedDisplay.large, isMetric, showLargeUnit, onValueChange, calculateGrams]);

  // Toggle expanded state and save to session storage
  const handleToggleExpanded = useCallback(() => {
    const newExpanded = !showLargeUnit;
    setShowLargeUnit(newExpanded);
    sessionStorage.setItem(EXPANDED_STATE_KEY, String(newExpanded));
  }, [showLargeUnit]);

  // Toggle metric/imperial and save to session storage
  const handleToggleMetric = useCallback(() => {
    const newMetric = !isMetric;
    setIsMetric(newMetric);
    sessionStorage.setItem(METRIC_STATE_KEY, String(newMetric));
    // Notify parent of display unit change
    if (valueGrams !== null) {
      onValueChange(valueGrams, getDisplayUnit(newMetric));
    }
  }, [isMetric, setIsMetric, valueGrams, onValueChange]);

  // Get total display text
  const getTotalDisplay = (): string => {
    if (!valueGrams || !showLargeUnit) return '';
    if (isMetric) {
      return `(${valueGrams} g total)`;
    } else {
      const totalOz = Math.round((valueGrams / OZ_TO_GRAMS) * 10) / 10;
      return `(${totalOz} oz total)`;
    }
  };

  const inputClassName = cn(
    'w-16 sm:w-24 h-8 text-sm',
    validation.status === 'error' && 'border-destructive focus-visible:ring-destructive',
    validation.status === 'warning' && 'border-amber-500 focus-visible:ring-amber-500'
  );

  const toggleButtonClassName = 'h-8 px-2 text-xs font-medium rounded border transition-colors bg-primary text-primary-foreground hover:bg-primary/90';

  const largeUnitLabel = isMetric ? 'kg' : 'lbs';
  const smallUnitLabel = isMetric ? 'g' : 'oz';

  return (
    <div className="space-y-2">
      {/* Label with optional helper text */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <Label>{label}</Label>
        {helperText && (
          <span className="text-xs text-muted-foreground">{helperText}</span>
        )}
      </div>

      {/* Single-line input row with all controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Large unit input (lbs/kg) - only shown when expanded */}
        {showLargeUnit && (
          <>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="0"
              value={derivedDisplay.large}
              onChange={(e) => handleLargeUnitChange(e.target.value)}
              className={inputClassName}
            />
            <span className="text-xs text-muted-foreground w-5">
              {largeUnitLabel}
            </span>
          </>
        )}

        {/* Small unit input (oz/g) - always shown */}
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step={isMetric ? '1' : '0.1'}
          placeholder={placeholder || '0'}
          value={derivedDisplay.small}
          onChange={(e) => handleSmallUnitChange(e.target.value)}
          className={inputClassName}
        />
        <span className="text-xs text-muted-foreground w-4">
          {smallUnitLabel}
        </span>

        {/* Toggle buttons - always blue (primary) for consistency */}
        <div className="flex items-center gap-1 ml-1">
          {/* Large unit toggle (lbs/kg) */}
          <button
            type="button"
            onClick={handleToggleExpanded}
            className={cn(
              toggleButtonClassName,
              !showLargeUnit && 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
            title={showLargeUnit ? `Hide ${largeUnitLabel}` : `Show ${largeUnitLabel}`}
          >
            {largeUnitLabel}
          </button>

          {/* Metric/Imperial toggle with Scale icon */}
          <button
            type="button"
            onClick={handleToggleMetric}
            className={cn(toggleButtonClassName, 'flex items-center gap-1')}
            title={`Switch to ${isMetric ? 'Imperial (lbs/oz)' : 'Metric (kg/g)'}`}
          >
            <Scale className="h-3 w-3" />
            <span>{isMetric ? 'g' : 'lb'}</span>
          </button>
        </div>

        {/* Total display - only when expanded and has value */}
        {showLargeUnit && valueGrams !== null && valueGrams > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            {getTotalDisplay()}
          </span>
        )}
      </div>

      {/* Validation message */}
      {validation.status !== 'ok' && (
        <div className={cn(
          'flex items-center gap-2 text-sm',
          validation.status === 'error' ? 'text-destructive' : 'text-amber-500'
        )}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{validation.message}</span>
        </div>
      )}
    </div>
  );
}
