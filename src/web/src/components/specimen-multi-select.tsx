'use client';

import * as React from 'react';
import { ChevronsUpDown, X, Search, AlertTriangle, Plus, User } from 'lucide-react';
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
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSpecimenSearch } from '@/hooks/use-user-specimens';
import type { SpecimenOptionDto } from '@/types/user-specimen';

// Selection item that tracks both ID and source
export interface SpecimenSelection {
  id: string;
  source: 'system' | 'user';
}

interface SpecimenMultiSelectProps {
  selectedItems: SpecimenSelection[];
  onSelectionChange: (items: SpecimenSelection[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onAddCustom?: () => void;  // Callback to open add custom specimen modal
  includePublicSpecimens?: boolean;
}

export function SpecimenMultiSelect({
  selectedItems,
  onSelectionChange,
  placeholder = 'Select specimens...',
  disabled = false,
  onAddCustom,
  includePublicSpecimens = true,
}: SpecimenMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch combined specimens (system + user + public)
  const { data: specimens = [], isLoading } = useSpecimenSearch(debouncedSearch, includePublicSpecimens);

  // Group specimens by source
  const groupedSpecimens = React.useMemo(() => {
    const userSpecimens: SpecimenOptionDto[] = [];
    const systemSpecimens: SpecimenOptionDto[] = [];

    specimens.forEach((specimen) => {
      if (specimen.source === 'user' && specimen.isOwned) {
        userSpecimens.push(specimen);
      } else if (specimen.source === 'system') {
        systemSpecimens.push(specimen);
      } else {
        // Public specimens from other users - show after system specimens
        systemSpecimens.push(specimen);
      }
    });

    return { userSpecimens, systemSpecimens };
  }, [specimens]);

  const selectedSpecimens = React.useMemo(() => {
    return specimens.filter((s) =>
      selectedItems.some((item) => item.id === s.id && item.source === s.source)
    );
  }, [specimens, selectedItems]);

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

  const handleToggle = (specimen: SpecimenOptionDto) => {
    const selection: SpecimenSelection = { id: specimen.id, source: specimen.source };
    const isSelected = selectedItems.some(
      (item) => item.id === specimen.id && item.source === specimen.source
    );

    if (isSelected) {
      onSelectionChange(
        selectedItems.filter((item) => !(item.id === specimen.id && item.source === specimen.source))
      );
    } else {
      onSelectionChange([...selectedItems, selection]);
    }
  };

  const handleRemove = (id: string, source: 'system' | 'user') => {
    onSelectionChange(
      selectedItems.filter((item) => !(item.id === id && item.source === source))
    );
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const isSelected = (specimen: SpecimenOptionDto) => {
    return selectedItems.some(
      (item) => item.id === specimen.id && item.source === specimen.source
    );
  };

  const renderSpecimenItem = (specimen: SpecimenOptionDto) => {
    const selected = isSelected(specimen);
    return (
      <CommandItem
        key={`${specimen.source}-${specimen.id}`}
        value={`${specimen.source}-${specimen.id}`}
        onSelect={() => handleToggle(specimen)}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Checkbox checked={selected} className="pointer-events-none" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{specimen.commonName}</span>
            {specimen.source === 'user' && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                <User className="h-3 w-3 mr-0.5" />
                {specimen.isOwned ? 'Mine' : 'Public'}
              </Badge>
            )}
          </div>
          {specimen.scientificName && (
            <div className="text-xs text-muted-foreground italic truncate">
              {specimen.scientificName}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground w-16 text-right">
          {specimen.tumblingDifficulty || '-'}
        </div>
      </CommandItem>
    );
  };

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
            disabled={disabled}
          >
            <span className="text-muted-foreground">
              {isLoading
                ? 'Loading specimens...'
                : selectedItems.length > 0
                ? `${selectedItems.length} selected`
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
                placeholder="Search specimens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <CommandList>
              {/* Add Custom Specimen Button */}
              {onAddCustom && (
                <>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        onAddCustom();
                      }}
                      className="flex items-center gap-2 cursor-pointer text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Custom Specimen</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading specimens...
                </div>
              ) : specimens.length === 0 ? (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No specimens found.</p>
                    {onAddCustom && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          onAddCustom();
                        }}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add a custom specimen
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  {/* Your Specimens Section */}
                  {groupedSpecimens.userSpecimens.length > 0 && (
                    <CommandGroup heading="Your Specimens" className="max-h-[120px] overflow-auto">
                      {groupedSpecimens.userSpecimens.map(renderSpecimenItem)}
                    </CommandGroup>
                  )}

                  {groupedSpecimens.userSpecimens.length > 0 &&
                    groupedSpecimens.systemSpecimens.length > 0 && <CommandSeparator />}

                  {/* Reference Specimens Section */}
                  {groupedSpecimens.systemSpecimens.length > 0 && (
                    <CommandGroup heading="Reference Specimens" className="max-h-[200px] overflow-auto">
                      {groupedSpecimens.systemSpecimens.map(renderSpecimenItem)}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>

            {/* Footer with Done button */}
            <div className="border-t p-2 bg-muted/30">
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                {selectedItems.length > 0
                  ? `Done (${selectedItems.length} selected)`
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
              key={`${specimen.source}-${specimen.id}`}
              variant="secondary"
              className={cn(
                "flex items-center gap-1 pr-1 text-foreground border",
                specimen.source === 'user'
                  ? "bg-blue-500/25 border-blue-500/50"
                  : "bg-primary/25 border-primary/50"
              )}
            >
              {specimen.source === 'user' && <User className="h-3 w-3" />}
              <span className="truncate max-w-[150px]">{specimen.commonName}</span>
              {specimen.tumblingDifficulty && (
                <span className="text-muted-foreground text-xs">
                  ({specimen.tumblingDifficulty})
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(specimen.id, specimen.source);
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

// Legacy prop interface for backward compatibility
interface LegacySpecimenMultiSelectProps {
  specimens: Array<{ specimenId: string; commonName: string; mohsHardnessMax: number | null; alias: string | null; variety: string | null; rockFamily: string | null; }>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

// Export a legacy wrapper for backward compatibility with existing code
export function LegacySpecimenMultiSelect({
  specimens,
  selectedIds,
  onSelectionChange,
  placeholder = 'Select specimens...',
  disabled = false,
  isLoading = false,
}: LegacySpecimenMultiSelectProps) {
  // Convert legacy format to new format
  const selectedItems: SpecimenSelection[] = selectedIds.map((id) => ({
    id,
    source: 'system' as const,
  }));

  const handleSelectionChange = (items: SpecimenSelection[]) => {
    // Convert back to legacy format (just IDs for system specimens)
    onSelectionChange(items.filter((i) => i.source === 'system').map((i) => i.id));
  };

  // This component doesn't use the new search API, it uses the passed specimens directly
  // For full functionality, update the parent component to use the new SpecimenMultiSelect
  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between min-h-[40px] h-auto"
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
          <Command>
            <CommandInput placeholder="Search specimens..." />
            <CommandList>
              <CommandEmpty>No specimens found.</CommandEmpty>
              <CommandGroup className="max-h-[250px] overflow-auto">
                {specimens.map((specimen) => {
                  const isSelected = selectedIds.includes(specimen.specimenId);
                  return (
                    <CommandItem
                      key={specimen.specimenId}
                      value={specimen.commonName}
                      onSelect={() => {
                        const newSelection = isSelected
                          ? selectedIds.filter((id) => id !== specimen.specimenId)
                          : [...selectedIds, specimen.specimenId];
                        onSelectionChange(newSelection);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <span className="flex-1 font-medium truncate">{specimen.commonName}</span>
                      {specimen.mohsHardnessMax && (
                        <span className="text-xs text-muted-foreground">
                          {specimen.mohsHardnessMax}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const specimen = specimens.find((s) => s.specimenId === id);
            if (!specimen) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="flex items-center gap-1 pr-1 bg-primary/25 text-foreground border border-primary/50"
              >
                <span className="truncate max-w-[150px]">{specimen.commonName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectionChange(selectedIds.filter((sid) => sid !== id));
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
