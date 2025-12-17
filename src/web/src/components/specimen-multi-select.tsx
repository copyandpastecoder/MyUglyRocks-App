'use client';

import * as React from 'react';
import { ChevronsUpDown, X, Search, AlertTriangle, Plus, User, Settings2, Package } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSpecimenSearch } from '@/hooks/use-user-specimens';
import { useAvailableInventorySpecimens, type AvailableInventorySpecimen } from '@/hooks/use-available-inventory-specimens';
import type { SpecimenOptionDto } from '@/types/user-specimen';

// Column visibility configuration
type ColumnKey = 'scientificName' | 'alias' | 'hardness' | 'difficulty' | 'materialType';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: 'scientificName', label: 'Scientific Name', defaultVisible: true },
  { key: 'alias', label: 'Alias', defaultVisible: true },
  { key: 'hardness', label: 'Hardness', defaultVisible: true },
  { key: 'difficulty', label: 'Tumbling Difficulty', defaultVisible: true },
  { key: 'materialType', label: 'Material Type', defaultVisible: false },
];

const STORAGE_KEY = 'specimen-dropdown-columns';

// Selection item that tracks both ID and source
export interface SpecimenSelection {
  id: string;
  source: 'system' | 'user';
  /** For inventory specimens - the inventory specimen ID for linking to the cycle */
  inventorySpecimenId?: string;
  /** For inventory specimens - whether to mark as depleted when cycle completes */
  markDepletedOnComplete?: boolean;
  /** For inventory specimens - whether to copy tagged photos from inventory to cycle */
  addPhotosFromInventory?: boolean;
}

interface SpecimenMultiSelectProps {
  selectedItems: SpecimenSelection[];
  onSelectionChange: (items: SpecimenSelection[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onAddCustom?: () => void;  // Callback to open add custom specimen modal
  includePublicSpecimens?: boolean;
  /** Enable the inventory mode toggle - allows selecting from user's inventory */
  enableInventoryMode?: boolean;
}

export function SpecimenMultiSelect({
  selectedItems,
  onSelectionChange,
  placeholder = 'Select specimens...',
  disabled = false,
  onAddCustom,
  includePublicSpecimens = true,
  enableInventoryMode = false,
}: SpecimenMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [inventoryMode, setInventoryMode] = React.useState(false);

  // Column visibility state - load from localStorage
  const [visibleColumns, setVisibleColumns] = React.useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    // Default visibility
    return AVAILABLE_COLUMNS.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible;
      return acc;
    }, {} as Record<ColumnKey, boolean>);
  });

  // Save column visibility to localStorage
  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch combined specimens (system + user + public) - for normal mode
  const { data: specimens = [], isLoading } = useSpecimenSearch(debouncedSearch, includePublicSpecimens);

  // Fetch inventory specimens - for inventory mode
  const { data: inventoryGroups = [], isLoading: isLoadingInventory } = useAvailableInventorySpecimens();

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
    // Only show specimens that are NOT inventory specimens (those are shown separately)
    return specimens.filter((s) =>
      selectedItems.some((item) =>
        item.id === s.id && item.source === s.source && !item.inventorySpecimenId
      )
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
    // Only check non-inventory specimens (inventory specimens are handled separately)
    const isSelected = selectedItems.some(
      (item) => item.id === specimen.id && item.source === specimen.source && !item.inventorySpecimenId
    );

    if (isSelected) {
      // Only remove non-inventory specimens with this id/source
      onSelectionChange(
        selectedItems.filter((item) =>
          !(!item.inventorySpecimenId && item.id === specimen.id && item.source === specimen.source)
        )
      );
    } else {
      onSelectionChange([...selectedItems, selection]);
    }
  };

  const handleRemove = (id: string, source: 'system' | 'user') => {
    // Only remove non-inventory specimens (inventory specimens have their own removal logic)
    onSelectionChange(
      selectedItems.filter((item) =>
        !(!item.inventorySpecimenId && item.id === id && item.source === source)
      )
    );
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const isSelected = (specimen: SpecimenOptionDto) => {
    // Only check non-inventory specimens (inventory specimens are shown separately)
    return selectedItems.some(
      (item) => item.id === specimen.id && item.source === specimen.source && !item.inventorySpecimenId
    );
  };

  // Inventory mode handlers
  const isInventorySpecimenSelected = (invSpecimen: AvailableInventorySpecimen) => {
    return selectedItems.some(
      (item) => item.inventorySpecimenId === invSpecimen.inventorySpecimenId
    );
  };

  const handleInventoryToggle = (invSpecimen: AvailableInventorySpecimen) => {
    const existingItem = selectedItems.find(
      (item) => item.inventorySpecimenId === invSpecimen.inventorySpecimenId
    );

    if (existingItem) {
      // Remove from selection
      onSelectionChange(
        selectedItems.filter((item) => item.inventorySpecimenId !== invSpecimen.inventorySpecimenId)
      );
    } else {
      // Add to selection with inventory specimen link
      const selection: SpecimenSelection = {
        id: invSpecimen.specimenId || invSpecimen.userSpecimenId || invSpecimen.inventorySpecimenId,
        source: invSpecimen.userSpecimenId ? 'user' : 'system',
        inventorySpecimenId: invSpecimen.inventorySpecimenId,
        markDepletedOnComplete: false,
      };
      onSelectionChange([...selectedItems, selection]);
    }
  };

  const handleMarkDepletedToggle = (inventorySpecimenId: string, checked: boolean) => {
    onSelectionChange(
      selectedItems.map((item) =>
        item.inventorySpecimenId === inventorySpecimenId
          ? { ...item, markDepletedOnComplete: checked }
          : item
      )
    );
  };

  const handleAddPhotosToggle = (inventorySpecimenId: string, checked: boolean) => {
    onSelectionChange(
      selectedItems.map((item) =>
        item.inventorySpecimenId === inventorySpecimenId
          ? { ...item, addPhotosFromInventory: checked }
          : item
      )
    );
  };

  const handleRemoveInventorySpecimen = (inventorySpecimenId: string) => {
    onSelectionChange(
      selectedItems.filter((item) => item.inventorySpecimenId !== inventorySpecimenId)
    );
  };

  // Filter inventory groups by search query
  const filteredInventoryGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return inventoryGroups;
    const query = searchQuery.toLowerCase();
    return inventoryGroups
      .map((group) => ({
        ...group,
        specimens: group.specimens.filter((s) =>
          s.commonName.toLowerCase().includes(query) ||
          group.inventoryName.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.specimens.length > 0);
  }, [inventoryGroups, searchQuery]);

  // Get selected inventory specimens for display
  const selectedInventorySpecimens = React.useMemo(() => {
    const inventoryItems = selectedItems.filter((item) => item.inventorySpecimenId);
    return inventoryItems.map((item) => {
      for (const group of inventoryGroups) {
        const specimen = group.specimens.find((s) => s.inventorySpecimenId === item.inventorySpecimenId);
        if (specimen) {
          return {
            ...specimen,
            markDepletedOnComplete: item.markDepletedOnComplete,
            addPhotosFromInventory: item.addPhotosFromInventory,
          };
        }
      }
      return null;
    }).filter(Boolean) as (AvailableInventorySpecimen & { markDepletedOnComplete?: boolean; addPhotosFromInventory?: boolean })[];
  }, [selectedItems, inventoryGroups]);

  const renderSpecimenItem = (specimen: SpecimenOptionDto) => {
    const selected = isSelected(specimen);

    // Build secondary info line based on visible columns
    const secondaryParts: React.ReactNode[] = [];
    if (visibleColumns.scientificName && specimen.scientificName) {
      secondaryParts.push(<span key="sci" className="italic">{specimen.scientificName}</span>);
    }
    if (visibleColumns.alias && specimen.alias) {
      secondaryParts.push(<span key="alias">aka &quot;{specimen.alias}&quot;</span>);
    }
    if (visibleColumns.materialType) {
      secondaryParts.push(<span key="mat">{specimen.materialType}</span>);
    }

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
          {secondaryParts.length > 0 && (
            <div className="text-xs text-muted-foreground truncate">
              {secondaryParts.map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && ' • '}
                  {part}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
          {visibleColumns.difficulty && (
            <span className="w-16 text-right">{specimen.tumblingDifficulty || '-'}</span>
          )}
          {visibleColumns.hardness && specimen.mohsHardnessMax && (
            <span className="w-16 text-right text-[10px]">H: {specimen.mohsHardnessMax}</span>
          )}
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
                placeholder={inventoryMode ? "Search inventory..." : "Search specimens..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {/* Inventory mode toggle */}
              {enableInventoryMode && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 ml-1",
                          inventoryMode && "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 hover:text-blue-600"
                        )}
                        onClick={() => setInventoryMode(!inventoryMode)}
                      >
                        <Package className="h-4 w-4" />
                        <span className="sr-only">Toggle inventory mode</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{inventoryMode ? "Switch to all specimens" : "Select from my inventory"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Column selector dropdown - only show in normal mode */}
              {!inventoryMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                      <Settings2 className="h-4 w-4" />
                      <span className="sr-only">Toggle columns</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {AVAILABLE_COLUMNS.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={visibleColumns[column.key]}
                        onCheckedChange={() => toggleColumn(column.key)}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <CommandList>
              {inventoryMode ? (
                /* Inventory Mode View */
                <>
                  {isLoadingInventory ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading inventory...
                    </div>
                  ) : filteredInventoryGroups.length === 0 ? (
                    <CommandEmpty>
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          {inventoryGroups.length === 0
                            ? "No available specimens in your inventory."
                            : "No matching specimens found."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Depleted specimens are hidden.
                        </p>
                      </div>
                    </CommandEmpty>
                  ) : (
                    <>
                      {filteredInventoryGroups.map((group) => (
                        <CommandGroup
                          key={group.inventoryId}
                          heading={
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5" />
                              <span>{group.inventoryName}</span>
                            </div>
                          }
                          className="max-h-[180px] overflow-auto"
                        >
                          {group.specimens.map((invSpecimen) => {
                            const selected = isInventorySpecimenSelected(invSpecimen);
                            const selectedItem = selectedItems.find(
                              (item) => item.inventorySpecimenId === invSpecimen.inventorySpecimenId
                            );
                            return (
                              <div
                                key={invSpecimen.inventorySpecimenId}
                                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                              >
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={() => handleInventoryToggle(invSpecimen)}
                                />
                                <div
                                  className="flex-1 min-w-0"
                                  onClick={() => handleInventoryToggle(invSpecimen)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{invSpecimen.commonName}</span>
                                    {invSpecimen.weightGrams && (
                                      <span className="text-xs text-muted-foreground">
                                        ({invSpecimen.weightGrams}g)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {selected && (
                                  <div
                                    className="flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1">
                                            <Checkbox
                                              checked={selectedItem?.addPhotosFromInventory || false}
                                              onCheckedChange={(checked) =>
                                                handleAddPhotosToggle(
                                                  invSpecimen.inventorySpecimenId,
                                                  checked === true
                                                )
                                              }
                                              className="h-3.5 w-3.5"
                                            />
                                            <span className="text-[10px] text-muted-foreground">Photos</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p>Copy tagged photos to cycle</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1">
                                            <Checkbox
                                              checked={selectedItem?.markDepletedOnComplete || false}
                                              onCheckedChange={(checked) =>
                                                handleMarkDepletedToggle(
                                                  invSpecimen.inventorySpecimenId,
                                                  checked === true
                                                )
                                              }
                                              className="h-3.5 w-3.5"
                                            />
                                            <span className="text-[10px] text-muted-foreground">Deplete</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p>Mark as depleted when cycle completes</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CommandGroup>
                      ))}
                    </>
                  )}
                </>
              ) : (
                /* Normal Mode View */
                <>
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

      {/* Selected Specimens as Chips - Normal Mode */}
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
        </div>
      )}

      {/* Selected Inventory Specimens as Chips */}
      {selectedInventorySpecimens.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedInventorySpecimens.map((invSpec) => (
            <Badge
              key={invSpec.inventorySpecimenId}
              variant="secondary"
              className="flex items-center gap-1 pr-1 text-foreground border bg-green-500/25 border-green-500/50"
            >
              <Package className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{invSpec.commonName}</span>
              {invSpec.weightGrams && (
                <span className="text-muted-foreground text-xs">
                  ({invSpec.weightGrams}g)
                </span>
              )}
              {invSpec.addPhotosFromInventory && (
                <span className="text-blue-500 text-[10px] font-medium">
                  +PHOTOS
                </span>
              )}
              {invSpec.markDepletedOnComplete && (
                <span className="text-orange-500 text-[10px] font-medium">
                  DEPLETE
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveInventorySpecimen(invSpec.inventorySpecimenId);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Clear All button */}
      {(selectedSpecimens.length + selectedInventorySpecimens.length) > 1 && (
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

      {/* Hardness Warning */}
      {hardnessWarning && (
        <Alert variant="warning" className="py-2">
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
