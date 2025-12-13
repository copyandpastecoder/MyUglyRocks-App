'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useSettings } from '@/hooks/use-user';
import { cn } from '@/lib/utils';

interface WeightInputProps {
  label: string;
  /** Value in grams (stored internally) */
  valueGrams: number | null;
  /** Called with new value in grams */
  onValueChange: (grams: number | null) => void;
  placeholder?: string;
  /** Barrel capacity in lbs for validation (optional) */
  barrelCapacityLbs?: number;
  /** Called when validation state changes */
  onValidationChange?: (isValid: boolean, message?: string) => void;
}

// Conversion constants
const LB_TO_GRAMS = 453.592;
const OZ_TO_GRAMS = 28.3495;
const KG_TO_GRAMS = 1000;

/**
 * Weight input that shows lbs + oz for Imperial or kg + g for Metric.
 * Stores value internally as grams.
 * User can toggle between Imperial and Metric.
 */
export function WeightInput({
  label,
  valueGrams,
  onValueChange,
  placeholder,
  barrelCapacityLbs,
  onValidationChange,
}: WeightInputProps) {
  const { data: settings } = useSettings();

  // Local state for unit system - defaults to user's preference
  const [isMetric, setIsMetric] = useState(false);
  const hasInitializedMetric = useRef(false);

  // Initialize unit system from settings when available (once only)
  useEffect(() => {
    if (!hasInitializedMetric.current && settings?.measurementSystem) {
      hasInitializedMetric.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initialization from settings
      setIsMetric(settings.measurementSystem === 'Metric');
    }
  }, [settings?.measurementSystem]);

  // Local state for the two input fields
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const lastSyncedGrams = useRef<number | null>(null);
  const lastSyncedMetric = useRef<boolean>(false);

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

  // Sync from external valueGrams when it changes or unit system changes
  // Only update if the external value or metric setting actually changed
  useEffect(() => {
    const gramsChanged = lastSyncedGrams.current !== valueGrams;
    const metricChanged = lastSyncedMetric.current !== isMetric;

    if (!gramsChanged && !metricChanged) {
      return;
    }

    lastSyncedGrams.current = valueGrams;
    lastSyncedMetric.current = isMetric;

    if (valueGrams === null || valueGrams === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from external value
      setPrimary('');
      setSecondary('');
      return;
    }

    if (isMetric) {
      // Metric: kg + g
      const kg = Math.floor(valueGrams / KG_TO_GRAMS);
      const g = Math.round(valueGrams % KG_TO_GRAMS);
      setPrimary(kg > 0 ? String(kg) : '');
      setSecondary(String(g));
    } else {
      // Imperial: lbs + oz
      const totalOz = valueGrams / OZ_TO_GRAMS;
      const lbs = Math.floor(totalOz / 16);
      const oz = Math.round((totalOz % 16) * 10) / 10; // Round to 1 decimal
      setPrimary(lbs > 0 ? String(lbs) : '');
      setSecondary(String(oz));
    }
  }, [valueGrams, isMetric]);

  const calculateGrams = (primaryVal: string, secondaryVal: string, metric: boolean): number | null => {
    const primaryNum = parseFloat(primaryVal) || 0;
    const secondaryNum = parseFloat(secondaryVal) || 0;

    if (primaryNum === 0 && secondaryNum === 0 && !primaryVal && !secondaryVal) {
      return null;
    }

    if (metric) {
      // Metric: primary = kg, secondary = g
      return Math.round(primaryNum * KG_TO_GRAMS + secondaryNum);
    } else {
      // Imperial: primary = lbs, secondary = oz
      return Math.round(primaryNum * LB_TO_GRAMS + secondaryNum * OZ_TO_GRAMS);
    }
  };

  const handlePrimaryChange = (value: string) => {
    setPrimary(value);
    onValueChange(calculateGrams(value, secondary, isMetric));
  };

  const handleSecondaryChange = (value: string) => {
    setSecondary(value);
    onValueChange(calculateGrams(primary, value, isMetric));
  };

  // Calculate total display for the secondary unit field placeholder
  const getTotalDisplay = (): string => {
    if (!valueGrams) return '';
    if (isMetric) {
      // Show total in grams
      return `(${valueGrams} g total)`;
    } else {
      // Show total in oz
      const totalOz = Math.round((valueGrams / OZ_TO_GRAMS) * 10) / 10;
      return `(${totalOz} oz total)`;
    }
  };

  const inputClassName = cn(
    'w-20',
    validation.status === 'error' && 'border-destructive focus-visible:ring-destructive',
    validation.status === 'warning' && 'border-amber-500 focus-visible:ring-amber-500'
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary unit: lbs or kg */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            step="1"
            placeholder={placeholder || '0'}
            value={primary}
            onChange={(e) => handlePrimaryChange(e.target.value)}
            className={inputClassName}
          />
          <span className="text-sm text-muted-foreground w-6">
            {isMetric ? 'kg' : 'lbs'}
          </span>
        </div>
        {/* Secondary unit: oz or g */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            max={isMetric ? 999 : 15.9}
            step="1"
            placeholder="0"
            value={secondary}
            onChange={(e) => handleSecondaryChange(e.target.value)}
            className={inputClassName}
          />
          <span className="text-sm text-muted-foreground w-4">
            {isMetric ? 'g' : 'oz'}
          </span>
        </div>
        {/* Segmented toggle buttons */}
        <div className="flex rounded-md border overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMetric(false)}
            className={cn(
              'px-2 py-1 text-xs font-medium transition-colors',
              !isMetric
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            )}
          >
            Imperial
          </button>
          <button
            type="button"
            onClick={() => setIsMetric(true)}
            className={cn(
              'px-2 py-1 text-xs font-medium transition-colors border-l',
              isMetric
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            )}
          >
            Metric
          </button>
        </div>
        {/* Total display */}
        {valueGrams && (
          <span className="text-xs text-muted-foreground">
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
