'use client';

import * as React from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSpecimenSearch } from '@/hooks/use-user-specimens';
import { useSettings } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import type { SpecimenOptionDto } from '@/types/user-specimen';

// Conversion constants
const LB_TO_GRAMS = 453.592;
const OZ_TO_GRAMS = 28.3495;
const KG_TO_GRAMS = 1000;

export interface SpecimenWithWeight {
  id: string;
  specimenId?: string;
  userSpecimenId?: string;
  commonName: string;
  scientificName?: string;
  materialType?: string;
  mohsHardnessMax?: number;
  source: 'system' | 'user';
  weightGrams: number | null;
}

interface SpecimenWeightTableProps {
  specimens: SpecimenWithWeight[];
  onSpecimensChange: (specimens: SpecimenWithWeight[]) => void;
  onAddCustom?: () => void;
}

export function SpecimenWeightTable({
  specimens,
  onSpecimensChange,
  onAddCustom,
}: SpecimenWeightTableProps) {
  const { data: settings } = useSettings();
  const [isMetric, setIsMetric] = React.useState(false);
  const [addPopoverOpen, setAddPopoverOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Initialize unit from settings
  React.useEffect(() => {
    if (settings?.measurementSystem) {
      setIsMetric(settings.measurementSystem === 'Metric');
    }
  }, [settings?.measurementSystem]);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch specimen options
  const { data: specimenOptions, isLoading } = useSpecimenSearch(debouncedSearch, true);

  // Filter out already selected specimens and group by source
  const availableSpecimens = React.useMemo(() => {
    if (!specimenOptions) return { systemSpecimens: [], userSpecimens: [] };

    const selectedIds = new Set(specimens.map(s => s.id));

    const filtered = specimenOptions.filter(s => !selectedIds.has(s.id));

    return {
      systemSpecimens: filtered.filter(s => s.source === 'system'),
      userSpecimens: filtered.filter(s => s.source === 'user'),
    };
  }, [specimenOptions, specimens]);

  // Check for hardness mismatch
  const hardnessMismatch = React.useMemo(() => {
    const specimensWithHardness = specimens.filter(
      s => s.mohsHardnessMax != null
    );

    if (specimensWithHardness.length < 2) return null;

    const hardnessValues = specimensWithHardness
      .map(s => s.mohsHardnessMax ?? 0)
      .filter(v => v > 0);

    if (hardnessValues.length < 2) return null;

    const overallMin = Math.min(...hardnessValues);
    const overallMax = Math.max(...hardnessValues);
    const range = overallMax - overallMin;

    if (range > 1) {
      return `Selected specimens have hardness ranging from ${overallMin} to ${overallMax} Mohs. Tumbling rocks with different hardness together may cause softer rocks to be damaged.`;
    }

    return null;
  }, [specimens]);

  // Calculate total weight
  const totalWeightGrams = React.useMemo(() => {
    return specimens
      .filter(s => s.weightGrams != null)
      .reduce((sum, s) => sum + (s.weightGrams || 0), 0);
  }, [specimens]);

  // Convert grams to display value
  const gramsToDisplay = (grams: number | null): string => {
    if (grams === null || grams === 0) return '';
    if (isMetric) {
      // Show in kg if >= 1kg, otherwise grams
      if (grams >= KG_TO_GRAMS) {
        return (grams / KG_TO_GRAMS).toFixed(2);
      }
      return grams.toString();
    } else {
      // Show in lbs
      return (grams / LB_TO_GRAMS).toFixed(2);
    }
  };

  // Convert display value to grams
  const displayToGrams = (value: string): number | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return null;
    if (isMetric) {
      // Assume kg if value has decimal or is small, otherwise grams
      if (num < 10 || value.includes('.')) {
        return Math.round(num * KG_TO_GRAMS);
      }
      return Math.round(num);
    } else {
      // Convert from lbs to grams
      return Math.round(num * LB_TO_GRAMS);
    }
  };

  // Format total weight for display
  const formatTotalWeight = (): string => {
    if (totalWeightGrams === 0) return '0';
    if (isMetric) {
      if (totalWeightGrams >= KG_TO_GRAMS) {
        return `${(totalWeightGrams / KG_TO_GRAMS).toFixed(2)} kg`;
      }
      return `${totalWeightGrams} g`;
    } else {
      const lbs = totalWeightGrams / LB_TO_GRAMS;
      return `${lbs.toFixed(2)} lbs`;
    }
  };

  // Handle adding a specimen
  const handleAddSpecimen = (option: SpecimenOptionDto) => {
    const newSpecimen: SpecimenWithWeight = {
      id: option.id,
      specimenId: option.source === 'system' ? option.id : undefined,
      userSpecimenId: option.source === 'user' ? option.id : undefined,
      commonName: option.commonName,
      scientificName: option.scientificName || undefined,
      materialType: option.materialType,
      mohsHardnessMax: option.mohsHardnessMax || undefined,
      source: option.source,
      weightGrams: null,
    };

    onSpecimensChange([...specimens, newSpecimen]);
    setAddPopoverOpen(false);
    setSearchQuery('');
  };

  // Handle removing a specimen
  const handleRemoveSpecimen = (id: string) => {
    onSpecimensChange(specimens.filter(s => s.id !== id));
  };

  // Handle weight change for a specimen
  const handleWeightChange = (id: string, value: string) => {
    const grams = displayToGrams(value);
    onSpecimensChange(
      specimens.map(s => (s.id === id ? { ...s, weightGrams: grams } : s))
    );
  };

  const unitLabel = isMetric ? 'kg' : 'lbs';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Specimens with Individual Weights</Label>
        <div className="flex items-center gap-2">
          {/* Unit toggle */}
          <div className="flex rounded-md border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsMetric(false)}
              className={cn(
                'px-2 py-1 font-medium transition-colors',
                !isMetric
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              )}
            >
              lbs
            </button>
            <button
              type="button"
              onClick={() => setIsMetric(true)}
              className={cn(
                'px-2 py-1 font-medium transition-colors border-l',
                isMetric
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              )}
            >
              kg
            </button>
          </div>
        </div>
      </div>

      {/* Hardness warning */}
      {hardnessMismatch && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{hardnessMismatch}</AlertDescription>
        </Alert>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Specimen</TableHead>
              <TableHead className="w-[30%]">Weight ({unitLabel})</TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specimens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No specimens added yet. Click &quot;Add Specimen&quot; below.
                </TableCell>
              </TableRow>
            ) : (
              specimens.map((specimen) => (
                <TableRow key={specimen.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{specimen.commonName}</span>
                      {specimen.scientificName && (
                        <span className="text-muted-foreground text-sm ml-2 italic">
                          {specimen.scientificName}
                        </span>
                      )}
                    </div>
                    {specimen.mohsHardnessMax && (
                      <div className="text-xs text-muted-foreground">
                        Hardness: {specimen.mohsHardnessMax}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={gramsToDisplay(specimen.weightGrams)}
                      onChange={(e) => handleWeightChange(specimen.id, e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSpecimen(specimen.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">{formatTotalWeight()}</TableCell>
              <TableCell className="text-right">
                <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search specimens..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isLoading ? 'Searching...' : 'No specimens found.'}
                        </CommandEmpty>
                        {availableSpecimens.userSpecimens.length > 0 && (
                          <CommandGroup heading="Your Specimens">
                            {availableSpecimens.userSpecimens.map((option) => (
                              <CommandItem
                                key={option.id}
                                value={option.id}
                                onSelect={() => handleAddSpecimen(option)}
                              >
                                <div className="flex flex-col">
                                  <span>{option.commonName}</span>
                                  {option.scientificName && (
                                    <span className="text-xs text-muted-foreground italic">
                                      {option.scientificName}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {availableSpecimens.systemSpecimens.length > 0 && (
                          <CommandGroup heading="Reference Specimens">
                            {availableSpecimens.systemSpecimens.map((option) => (
                              <CommandItem
                                key={option.id}
                                value={option.id}
                                onSelect={() => handleAddSpecimen(option)}
                              >
                                <div className="flex flex-col">
                                  <span>{option.commonName}</span>
                                  {option.scientificName && (
                                    <span className="text-xs text-muted-foreground italic">
                                      {option.scientificName}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                    {onAddCustom && (
                      <div className="p-2 border-t">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setAddPopoverOpen(false);
                            onAddCustom();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Specimen
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {specimens.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {specimens.filter(s => s.weightGrams != null).length} of {specimens.length} specimens have weights entered.
          Total: {formatTotalWeight()}
        </p>
      )}
    </div>
  );
}
