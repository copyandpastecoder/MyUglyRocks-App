'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SpecimenListDto } from '@/types/reference';

interface SpecimenMultiSelectProps {
  specimens: SpecimenListDto[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

interface DisplayColumn {
  key: keyof SpecimenListDto;
  label: string;
  enabled: boolean;
}

const defaultColumns: DisplayColumn[] = [
  { key: 'commonName', label: 'Common Name', enabled: true },
  { key: 'mohsHardnessMax', label: 'Max Hardness', enabled: true },
  { key: 'alias', label: 'Alias', enabled: false },
  { key: 'variety', label: 'Variety', enabled: false },
  { key: 'rockFamily', label: 'Rock Family', enabled: false },
];

export function SpecimenMultiSelect({
  specimens,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select specimens...',
  disabled = false,
  isLoading = false,
}: SpecimenMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [columns, setColumns] = React.useState<DisplayColumn[]>(defaultColumns);
  const [showColumnSettings, setShowColumnSettings] = React.useState(false);

  // Filter specimens based on search query across multiple fields
  const filteredSpecimens = React.useMemo(() => {
    if (!searchQuery.trim()) return specimens;

    const query = searchQuery.toLowerCase();
    return specimens.filter((specimen) => {
      return (
        specimen.commonName.toLowerCase().includes(query) ||
        (specimen.alias && specimen.alias.toLowerCase().includes(query)) ||
        (specimen.variety && specimen.variety.toLowerCase().includes(query)) ||
        (specimen.rockFamily && specimen.rockFamily.toLowerCase().includes(query))
      );
    });
  }, [specimens, searchQuery]);

  const selectedSpecimens = React.useMemo(() => {
    return specimens.filter((s) => selectedIds.includes(s.id));
  }, [specimens, selectedIds]);

  // Calculate hardness warning when specimens have >1 difference in max hardness
  const hardnessWarning = React.useMemo(() => {
    if (selectedSpecimens.length < 2) return null;

    const hardnessValues = selectedSpecimens
      .map((s) => s.mohsHardnessMax)
      .filter((h): h is number => h !== null);

    if (hardnessValues.length < 2) return null;

    const minHardness = Math.min(...hardnessValues);
    const maxHardness = Math.max(...hardnessValues);
    const difference = maxHardness - minHardness;

    if (difference > 1) {
      return {
        difference: difference.toFixed(1),
        min: minHardness,
        max: maxHardness,
      };
    }
    return null;
  }, [selectedSpecimens]);

  const handleToggle = (specimenId: string) => {
    const newSelection = selectedIds.includes(specimenId)
      ? selectedIds.filter((id) => id !== specimenId)
      : [...selectedIds, specimenId];
    onSelectionChange(newSelection);
  };

  const handleRemove = (specimenId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== specimenId));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const toggleColumn = (key: keyof SpecimenListDto) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, enabled: !col.enabled } : col
      )
    );
  };

  const formatHardness = (specimen: SpecimenListDto) => {
    if (specimen.mohsHardnessMax !== null) {
      return `${specimen.mohsHardnessMax}`;
    }
    return '-';
  };

  const getDisplayValue = (specimen: SpecimenListDto, key: keyof SpecimenListDto) => {
    if (key === 'mohsHardnessMax') {
      return formatHardness(specimen);
    }
    const value = specimen[key];
    return value !== null && value !== undefined ? String(value) : '-';
  };

  const enabledColumns = columns.filter((col) => col.enabled);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-[40px] h-auto",
              open && "invisible h-0 min-h-0 p-0 m-0 border-0"
            )}
            disabled={disabled || isLoading}
          >
            <span className="text-muted-foreground">
              {isLoading
                ? 'Loading specimens...'
                : selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search by name, alias, variety, or family..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Column Settings Toggle */}
            <div className="border-b px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showColumnSettings ? 'Hide' : 'Show'} column options
              </Button>

              {showColumnSettings && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Checkbox
                        checked={col.enabled}
                        onCheckedChange={() => toggleColumn(col.key)}
                        disabled={col.key === 'commonName'} // Always show common name
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <CommandList>
              <CommandEmpty>No specimens found.</CommandEmpty>
              <CommandGroup className="max-h-[250px] overflow-auto">
                {/* Header Row */}
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground border-b bg-muted/50">
                  <div className="w-6" /> {/* Checkbox space */}
                  {enabledColumns.map((col) => (
                    <div
                      key={col.key}
                      className={cn(
                        'truncate',
                        col.key === 'commonName' ? 'flex-1' : 'w-24'
                      )}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>

                {filteredSpecimens.map((specimen) => {
                  const isSelected = selectedIds.includes(specimen.id);
                  return (
                    <CommandItem
                      key={specimen.id}
                      value={specimen.id}
                      onSelect={() => handleToggle(specimen.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                      {enabledColumns.map((col) => (
                        <div
                          key={col.key}
                          className={cn(
                            'truncate text-sm',
                            col.key === 'commonName' ? 'flex-1 font-medium' : 'w-24 text-muted-foreground'
                          )}
                          title={getDisplayValue(specimen, col.key)}
                        >
                          {getDisplayValue(specimen, col.key)}
                        </div>
                      ))}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>

            {/* Footer with Done button */}
            <div className="border-t p-2 bg-muted/30">
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                {selectedIds.length > 0
                  ? `Done (${selectedIds.length} selected)`
                  : 'Done'}
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Specimens as Chips */}
      {selectedSpecimens.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSpecimens.map((specimen) => (
            <Badge
              key={specimen.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1 bg-primary/25 text-foreground border border-primary/50"
            >
              <span className="truncate max-w-[150px]">{specimen.commonName}</span>
              {specimen.mohsHardnessMax && (
                <span className="text-muted-foreground text-xs">
                  ({specimen.mohsHardnessMax})
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(specimen.id);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedSpecimens.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Hardness Warning */}
      {hardnessWarning && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Selected specimens have a hardness difference of {hardnessWarning.difference} (range: {hardnessWarning.min} - {hardnessWarning.max}).
            Tumbling rocks with more than 1 point difference may damage softer specimens.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
